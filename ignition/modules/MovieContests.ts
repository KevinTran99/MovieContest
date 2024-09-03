import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const MovieContestsModule = buildModule('MovieContestsModule', m => {
  const movieContests = m.contract('MovieContest', [], {});

  return { movieContests };
});

export default MovieContestsModule;
