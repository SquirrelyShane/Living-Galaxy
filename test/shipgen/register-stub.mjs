/* node --import ./test/shipgen/register-stub.mjs <script>  → resolves bare "three" to the stub */
import { register } from "node:module";
register(new URL("./stub-loader.mjs", import.meta.url));
