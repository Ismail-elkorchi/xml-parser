import { runBasicExample } from "./basic.mjs";
import { runStreamExample } from "./stream.mjs";
import { runValidationProfileExample } from "./validation-profile.mjs";

runBasicExample();
await runStreamExample();
runValidationProfileExample();

process.stdout.write("all examples passed\n");
