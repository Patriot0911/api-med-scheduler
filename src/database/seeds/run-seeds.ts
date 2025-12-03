import DataSource from '../data-source';
import { SeedAdmin1764715155324 } from './1764715155324-SeedAdmin';

async function runSeeds() {
  const ds = await DataSource.initialize();

  const seed = new SeedAdmin1764715155324();
  await seed.up(ds.createQueryRunner());

  await ds.destroy();
  console.log('Seeds executed successfully');
}

runSeeds().catch((err) => {
  console.error(err);
  process.exit(1);
});
