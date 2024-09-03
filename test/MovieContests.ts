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

    it('Should set the movie in the contestMovies mapping to true when a movie has been added', async function () {
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

  describe('startContest function', function () {
    it('Should revert if contest does not exist', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await expect(
        movieContests.startContest(owner.address, 'Best Movie 2009', 1)
      ).to.be.revertedWith('This contest does not exist.');
    });

    it('Should revert if invalid contest status', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 1);

      await expect(
        movieContests.startContest(owner.address, 'Best Movie 2009', 1)
      ).to.be.revertedWith(
        'Invalid contest status, this action cannot be performed.'
      );
    });

    it('Should revert if a non-contest creator tries to start a contest they did not create', async function () {
      const { movieContests, owner, notOwner } =
        await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');

      await expect(
        movieContests
          .connect(notOwner)
          .startContest(owner.address, 'Best Movie 2009', 1)
      )
        .to.be.revertedWithCustomError(movieContests, 'NotOwner')
        .withArgs(notOwner.address);
    });

    it('Should revert if contest is not started with at least 2 movies', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');

      await expect(
        movieContests.startContest(owner.address, 'Best Movie 2009', 1)
      ).to.be.revertedWith('This contest needs at least two movies to start.');
    });

    it('Should start a contest with the correct deadline', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 3600);

      const expectedDeadline =
        ((await hre.ethers.provider.getBlock('latest'))?.timestamp ?? 0) + 3600;

      expect(
        (await movieContests.contests(owner.address, 'Best Movie 2009'))
          .deadline
      ).to.equal(expectedDeadline);
    });

    it('Should set contestStatus to Ongoing when a contest has started', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 3600);

      expect(
        (await movieContests.contests(owner.address, 'Best Movie 2009'))
          .contestStatus
      ).to.equal(1);
    });

    it('Should emit ContestStarted event when a contest has started', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');

      await expect(
        movieContests.startContest(owner.address, 'Best Movie 2009', 3600)
      )
        .to.emit(movieContests, 'ContestStarted')
        .withArgs(owner.address, 'Best Movie 2009');
    });
  });

  describe('voteMovie function', function () {
    it('Should revert if contest does not exist', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await expect(
        movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar')
      ).to.be.revertedWith('This contest does not exist.');
    });

    it('Should revert if movie does not exist', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');

      await expect(
        movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar')
      ).to.be.revertedWith('This movie title does not exist in this contest.');
    });

    it('Should revert if invalid contest status', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');

      await expect(
        movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar')
      ).to.be.revertedWith(
        'Invalid contest status, this action cannot be performed.'
      );
    });

    it('Should revert if address has already voted', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 3600);
      await movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar');

      const hasVoted = await movieContests.hasVoted(
        owner.address,
        'Best Movie 2009',
        owner.address
      );

      await expect(
        movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar')
      )
        .to.be.revertedWithCustomError(movieContests, 'AlreadyVoted')
        .withArgs(owner.address, hasVoted);
    });

    it('Should revert if deadline has passed', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 1);

      await expect(
        movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar')
      ).to.be.revertedWith('Voting period has ended.');
    });

    it('Should increase the voteCount for voted movie by 1', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 3600);

      expect(
        (await movieContests.getMovies(owner.address, 'Best Movie 2009'))[0]
          .voteCount
      ).to.equal(0);

      await movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar');

      expect(
        (await movieContests.getMovies(owner.address, 'Best Movie 2009'))[0]
          .voteCount
      ).to.equal(1);
    });

    it('Should set the address in the hasVoted mapping to true if voting is successful', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 3600);
      await movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar');

      expect(
        await movieContests.hasVoted(
          owner.address,
          'Best Movie 2009',
          owner.address
        )
      ).to.be.true;
    });
  });

  describe('endContest function', function () {
    it('Should revert if contest does not exist', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await expect(
        movieContests.endContest(owner.address, 'Best Movie 2009')
      ).to.be.revertedWith('This contest does not exist.');
    });

    it('Should revert if invalid contest status', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');

      await expect(
        movieContests.endContest(owner.address, 'Best Movie 2009')
      ).to.be.revertedWith(
        'Invalid contest status, this action cannot be performed.'
      );
    });

    it('Should revert if non-contest creator tries to end a contest they did not create', async function () {
      const { movieContests, owner, notOwner } =
        await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 3600);

      await expect(
        movieContests
          .connect(notOwner)
          .endContest(owner.address, 'Best Movie 2009')
      )
        .to.be.revertedWithCustomError(movieContests, 'NotOwner')
        .withArgs(notOwner.address);
    });

    it('Should revert if deadline for contest has not passed yet', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 3600);

      await expect(
        movieContests.endContest(owner.address, 'Best Movie 2009')
      ).to.be.revertedWith(
        'The deadline for this contest have not passed yet.'
      );
    });

    it('Should set contest winner to tie if it became a tie between the movies', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 1);
      await movieContests.endContest(owner.address, 'Best Movie 2009');

      expect(
        (await movieContests.contests(owner.address, 'Best Movie 2009')).winner
      ).to.equal('The result was a tie');
    });

    it('Should set contest winner to the movie with the most votes', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 2);
      await movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.endContest(owner.address, 'Best Movie 2009');

      expect(
        (await movieContests.contests(owner.address, 'Best Movie 2009')).winner
      ).to.equal('Avatar');
    });

    it('Should set contestStatus to Finished when a contest has ended', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 2);
      await movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.endContest(owner.address, 'Best Movie 2009');

      expect(
        (await movieContests.contests(owner.address, 'Best Movie 2009'))
          .contestStatus
      ).to.equal(2);
    });

    it('Should emit ContestEnded event when a contest has ended', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 2);
      await movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar');

      await expect(movieContests.endContest(owner.address, 'Best Movie 2009'))
        .to.emit(movieContests, 'ContestEnded')
        .withArgs(owner.address, 'Best Movie 2009', 'Avatar');
    });
  });

  describe('getWinner function', function () {
    it('Should revert if contest does not exist', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await expect(
        movieContests.getWinner(owner.address, 'Best Movie 2009')
      ).to.be.revertedWith('This contest does not exist.');
    });

    it('Should revert if invalid contest status', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');

      await expect(
        movieContests.getWinner(owner.address, 'Best Movie 2009')
      ).to.be.revertedWith(
        'Invalid contest status, this action cannot be performed.'
      );
    });

    it('Should return the correct winner', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 2);
      await movieContests.voteMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.endContest(owner.address, 'Best Movie 2009');

      expect(
        await movieContests.getWinner(owner.address, 'Best Movie 2009')
      ).to.equal('Avatar');
    });

    it('Should return tie message if it became a tie between the movies', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await movieContests.addContest('Best Movie 2009');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Avatar');
      await movieContests.addMovie(owner.address, 'Best Movie 2009', 'Up');
      await movieContests.startContest(owner.address, 'Best Movie 2009', 1);
      await movieContests.endContest(owner.address, 'Best Movie 2009');

      expect(
        await movieContests.getWinner(owner.address, 'Best Movie 2009')
      ).to.equal('The result was a tie');
    });
  });

  describe('fallback function', function () {
    it('Should revert with the correct error when fallback is called', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await expect(
        owner.sendTransaction({
          to: movieContests.getAddress(),
          data: '0x12345678',
        })
      ).to.be.revertedWith('Fallback function. Call a function that exists.');
    });
  });

  describe('receive function', function () {
    it('Should revert with the correct error when receive is called', async function () {
      const { movieContests, owner } = await deployMovieContestsFixture();

      await expect(
        owner.sendTransaction({
          to: movieContests.getAddress(),
          value: hre.ethers.parseEther('1.0'),
        })
      ).to.be.revertedWith('This contract does not accept payments.');
    });
  });
});
