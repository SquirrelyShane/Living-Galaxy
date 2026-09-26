import json, os, pathlib, shutil, socket, subprocess, tempfile, time, urllib.request, urllib.error
root=pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as folder:
    path=pathlib.Path(folder)
    shutil.copy2(root/'server.py',path/'server.py')
    sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
    base=f'http://127.0.0.1:{port}'
    env={**os.environ,'SOL_HOST_TOKEN':'test-only-token','SOL_RELAY_URL':base,'LG_HOST':'127.0.0.1','LG_MENU':'0','SOL_STATE_DB':str(path/'sol-state.sqlite3')}
    logs=open(path/'service.log','w+')
    processes=[]
    def start_relay():
        proc=subprocess.Popen(['python3',str(path/'server.py'),str(port)],env=env,stdout=logs,stderr=logs);processes.append(proc)
        for _ in range(100):
            try: get('/net/ping');return proc
            except OSError: time.sleep(.1)
        raise AssertionError('relay did not start')
    def get(route):
        return json.load(urllib.request.urlopen(base+route,timeout=3))
    def start_host():
        proc=subprocess.Popen(['node',str(root/'host/sol-host.mjs')],cwd=root,env=env,stdout=logs,stderr=logs);processes.append(proc);return proc
    def wait_checkpoint(after=0):
        for _ in range(200):
            world=get('/net/world?room=sol')
            if world['wseq']>after:return world
            time.sleep(.1)
        raise AssertionError('host did not checkpoint')
    try:
        relay=start_relay();host=start_host()
        first=wait_checkpoint()
        second=wait_checkpoint(first['wseq']+1)
        assert second['world']['time']>first['world']['time']
        assert get('/net/poll?room=sol&self=test&since=-1')['host']=='__sol_authority__'
        assert get('/net/gnn')['broadcasts']
        for route,body in [('/net/sol-host',{}),('/net/world',{'room':'sol','from':'intruder','world':{}}),('/net/send',{'room':'sol','from':'__sol_authority__','kind':'msg','data':{}})]:
            try:
                urllib.request.urlopen(urllib.request.Request(base+route,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'}));raise AssertionError('unauthorized write accepted')
            except urllib.error.HTTPError as e:assert e.code==403
        try:get('/net/sol-host');raise AssertionError('private state exposed')
        except urllib.error.HTTPError as e:assert e.code==403
        host.terminate();host.wait(timeout=15)
        committed=get('/net/world?room=sol')
        news=get('/net/gnn')['broadcasts']
        relay.terminate();relay.wait(timeout=5)
        relay=start_relay()
        restored=get('/net/world?room=sol')
        assert restored['world']==committed['world']
        assert restored['worldRevision']==committed['worldRevision']
        assert get('/net/poll?room=sol&self=test&since=-1')['worldRevision']==restored['worldRevision']
        assert get('/net/gnn')['broadcasts']==news
        assert get('/net/poll?room=sol&self=test&since=-1')['host']=='__sol_authority__'
        host=start_host();resumed=wait_checkpoint(restored['wseq']+1)
        assert resumed['world']['time']>=restored['world']['time']
        print('PASS: zero-player simulation, checkpoint restore, archive restart, reserved authority, authenticated writes, private resume endpoint')
    except Exception:
        logs.flush();logs.seek(0);print(logs.read()[-7000:]);raise
    finally:
        for proc in reversed(processes):
            if proc.poll() is None:
                proc.terminate()
                try:proc.wait(timeout=10)
                except subprocess.TimeoutExpired:proc.kill();proc.wait()
