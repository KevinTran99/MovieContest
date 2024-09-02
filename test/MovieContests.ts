import { expect } from 'chai';
import hre from 'hardhat';

describe('MovieContests', function () {
  async function deployMovieContestsFixture() {
    const [owner, user, notOwner] = await hre.ethers.getSigners();

    const MovieContests = await hre.ethers.getContractFactory('MovieContest');
    const movieContests = await MovieContests.deploy();

    return { movieContests, owner, user, notOwner };
  }

  describe('Deployment', function () {
    it('Should set the correct contract owner', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      expect(await movieContests.owner()).to.equal(owner.address);
    });
  });

  describe('addContest function', function () {
    it('Should allow a user to add a new contest', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');

      expect(
        (await movieContests.contests(owner.address, 'Best Movie 2009')).exist
      ).to.be.true;
    });

    it('Should revert if a user adds the same contest twice', async function () {
      const { movieContests } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');

      await expect(
        movieContests.addContest('Best Movie 2009')
      ).to.be.revertedWith(
        'This address have already added a contest with the same name.'
      );
    });

    it('Should set the contest exist flag to true for a new contest', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');

      expect(
        (await movieContests.contests(owner.address, 'Best Movie 2009')).exist
      ).to.be.true;
    });

    it('Should set the contestStatus to notStarted for a new contest', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');

      expect(
        (await movieContests.contests(owner.address, 'Best Movie 2009'))
          .contestStatus
      ).to.equal(0);
    });
  });

  describe('addMovie function', function () {
    it('Should allow the contest creator to add movies to their own contest', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');

      const movies = await movieContests.getMovies(
        owner.address,
        'Best Movie 2009'
      );

      expect(movies[0].title).to.equal('Avatar');
    });

    it('Should revert if contest does not exist', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await expect(
        movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar')
      ).to.be.revertedWith('This contest does not exist.');
    });

    it('Should revert if invalid contest status', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 1);

      await expect(
        movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar')
      ).to.be.revertedWith(
        'Invalid contest status, this action cannot be performed.'
      );
    });

    it('Should revert if a non-contest creator tries to add a movie to a contest they did not create', async function () {
      const { movieContests, owner, notOwner } =
        await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');

      await expect(
        movieContests
          .connect(notOwner)
          .addMovie(owner.address, 'Best Movie 2009', 'Avatar')
      )
        .to.be.revertedWithCustomError(movieContests, 'NotOwner')
        .withArgs(notOwner.address);
    });

    it('Should set the voteCount for the added movie to 0', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');

      const movies = await movieContests.getMovies(
        owner.address,
        'Best Movie 2009'
      );

      expect(movies[0].voteCount).to.equal(0);
    });

    it('Should set the movie in the contestMovies mapping to true when a movie is added', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');

      expect(
        await movieContests.contestMovies(
          owner.address,
          'Best Movie 2009',
          'Avatar'
        )
      ).to.be.true;
    });
  });

  describe('getMovies function', function () {
    it('Should return the list of movies for an existing contest', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');

      const movies = await movieContests.getMovies(
        owner.address,
        'Best Movie 2009'
      );

      expect(movies.length).to.equal(2);
      expect(movies[0].title).to.equal('Avatar');
      expect(movies[1].title).to.equal('Up');
    });

    it('Should return empty list if no movies has been added to a contest', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');

      const movies = await movieContests.getMovies(
        owner.address,
        'Best Movie 2009'
      );

      expect(movies.length).to.equal(0);
    });

    it('Should revert if contest does not exist', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await expect(
        movieContests.getMovies(owner.address, 'Best Movie 2009')
      ).to.be.revertedWith('This contest does not exist.');
    });
  });
});
