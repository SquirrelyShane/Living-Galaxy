import ast, copy, hashlib, json
from pathlib import Path
source=ast.parse((Path(__file__).resolve().parents[1]/'server.py').read_text())
function=next(node for node in source.body if isinstance(node,ast.FunctionDef) and node.name=='world_revision')
namespace={'hashlib':hashlib,'json':json}
exec(compile(ast.Module(body=[function],type_ignores=[]),'<world_revision>','exec'),namespace)
revision=namespace['world_revision']
base={'v':1,'time':1,'bodies':{'earth':{'integrity':.8,'radius':5,'thermal':30,'craters':[{'nx':1,'r':1,'depth':2,'depth0':2}]}},'ports':{},'lost':[],'impactors':[{'x':1}]}
changed=copy.deepcopy(base);changed.update(time=6,gnn=[{'title':'news'}],trafficDown={'ship':9},impactors=[{'x':800}],holes=[{'x':3}]);changed['bodies']['earth']['thermal']=2;changed['bodies']['earth']['craters'][0]['depth']=1
assert revision(base)==revision(changed)
changed['bodies']['warm-only']={'integrity':1,'radius':20,'thermal':40,'craters':[]}
assert revision(base)==revision(changed)
ring_a=copy.deepcopy(base);ring_a['bodies']['earth']['ring']={'inner':1,'outer':2,'roche':3,'born':4,'settle':0}
ring_b=copy.deepcopy(ring_a);ring_b['bodies']['earth']['ring']['settle']=.9
assert revision(ring_a)==revision(ring_b)
changed['bodies']['earth']['craters'].append({'nx':0,'r':2,'depth0':3})
assert revision(base)!=revision(changed)
for key,value in [('lost',['port']),('ports',{'port':{'claimed':True}})]:
    other=copy.deepcopy(base);other[key]=value;assert revision(other)!=revision(base)
assert revision(base)==revision(json.loads(json.dumps(base,sort_keys=True)))
print('world revision: PASS — transient motion, cooling and news ignored; impacts and port changes detected')
