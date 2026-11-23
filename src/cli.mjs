import { readFileSync } from 'node:fs';
import { inspectCard, convertFile, verifyConversion } from './converter.mjs';

const [command, ...args] = process.argv.slice(2);
try {
  let result;
  if (command === 'inspect' && args.length === 1) {
    result = inspectCard(readFileSync(args[0]));
  } else if (command === 'verify' && args.length === 2) {
    result = verifyConversion(readFileSync(args[0]), readFileSync(args[1]));
  } else if (command === 'convert' && args.length === 3 && args[2] === '--experimental') {
    result = convertFile(args[0], args[1], { experimental: true });
    result.warning = 'Experimental: structural checks passed; gameplay is not verified. Test only in a separate runtime.';
  } else {
    throw new Error('Usage: inspect INPUT | convert INPUT OUTPUT --experimental | verify INPUT OUTPUT');
  }
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
