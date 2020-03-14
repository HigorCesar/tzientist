import * as scientist from './index';

describe('Experiment', () => {
  const publishMock: jest.Mock<void, [scientist.Results<any>]> = jest.fn<
    void,
    [scientist.Results<any>]
  >();

  afterEach(() => {
    publishMock.mockClear();
  });

  describe('when functions are equivalent', () => {
    function sum(a: number, b: number): number {
      return a + b;
    }

    function sum2(a: number, b: number): number {
      return b + a;
    }

    it('should return result', () => {
      const experiment = scientist.experiment({
        name: 'equivalent1',
        control: sum,
        candidate: sum2,
        options: {
          publish: publishMock
        }
      });

      const result: number = experiment(1, 2);

      expect(result).toBe(3);
    });

    it('should publish results', () => {
      const experiment = scientist.experiment({
        name: 'equivalent2',
        control: sum,
        candidate: sum2,
        options: {
          publish: publishMock
        }
      });

      experiment(1, 2);

      expect(publishMock.mock.calls.length).toBe(1);
      const results = publishMock.mock.calls[0][0];
      expect(results.experimentName).toBe('equivalent2');
      expect(results.controlResult).toBe(3);
      expect(results.candidateResult).toBe(3);
      expect(results.controlError).toBeUndefined();
      expect(results.candidateError).toBeUndefined();
    });
  });

  describe('when function results differ', () => {
    function ctrl(s: string): string {
      return `Ctrl+${s}`;
    }

    function candi(s: string): string {
      return s;
    }

    it('should return result of control', () => {
      const experiment = scientist.experiment({
        name: 'differ1',
        control: ctrl,
        candidate: candi,
        options: {
          publish: publishMock
        }
      });

      const result: string = experiment('C');

      expect(result).toBe('Ctrl+C');
    });

    it('should publish results', () => {
      const experiment = scientist.experiment({
        name: 'differ2',
        control: ctrl,
        candidate: candi,
        options: {
          publish: publishMock
        }
      });

      experiment('C');

      expect(publishMock.mock.calls.length).toBe(1);
      const results = publishMock.mock.calls[0][0];
      expect(results.experimentName).toBe('differ2');
      expect(results.controlResult).toBe('Ctrl+C');
      expect(results.candidateResult).toBe('C');
      expect(results.controlError).toBeUndefined();
      expect(results.candidateError).toBeUndefined();
    });
  });

  describe('when candidate throws', () => {
    function ctrl(): string {
      return 'Everything is under control';
    }

    function candi(): string {
      throw new Error("Candy I can't let you go");
    }

    it('should return result of control', () => {
      const experiment = scientist.experiment({
        name: 'throw1',
        control: ctrl,
        candidate: candi,
        options: {
          publish: publishMock
        }
      });

      const result: string = experiment();

      expect(result).toBe('Everything is under control');
    });

    it('should publish results', () => {
      const experiment = scientist.experiment({
        name: 'throw2',
        control: ctrl,
        candidate: candi,
        options: {
          publish: publishMock
        }
      });

      experiment();

      expect(publishMock.mock.calls.length).toBe(1);
      const results = publishMock.mock.calls[0][0];
      expect(results.experimentName).toBe('throw2');
      expect(results.controlResult).toBe('Everything is under control');
      expect(results.candidateResult).toBeUndefined();
      expect(results.controlError).toBeUndefined();
      expect(results.candidateError).toBeDefined();
      expect(results.candidateError.message).toBe("Candy I can't let you go");
    });
  });

  describe('when control throws', () => {
    function ctrl(): string {
      throw new Error('Kaos!');
    }

    function candi(): string {
      return 'Kane';
    }

    it('should throw', () => {
      const experiment = scientist.experiment({
        name: 'cthrow1',
        control: ctrl,
        candidate: candi,
        options: {
          publish: publishMock
        }
      });

      expect(() => experiment()).toThrowError('Kaos!');
    });

    it('should publish results', () => {
      const experiment = scientist.experiment({
        name: 'cthrow2',
        control: ctrl,
        candidate: candi,
        options: {
          publish: publishMock
        }
      });

      try {
        experiment();
      } catch {
        // swallow error
      }

      expect(publishMock.mock.calls.length).toBe(1);
      const results = publishMock.mock.calls[0][0];
      expect(results.experimentName).toBe('cthrow2');
      expect(results.controlResult).toBeUndefined();
      expect(results.candidateResult).toBe('Kane');
      expect(results.controlError).toBeDefined();
      expect(results.controlError.message).toBe('Kaos!');
      expect(results.candidateError).toBeUndefined();
    });
  });

  describe('when enabled option is specified', () => {
    const candidateMock: jest.Mock<string, [string]> = jest.fn<
      string,
      [string]
    >();

    afterEach(() => {
      candidateMock.mockClear();
    });

    describe('when control does not throw', () => {
      function ctrl(s: string): string {
        return `Ctrl+${s}`;
      }

      describe('when enabled returns false', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function enabled(_: string): boolean {
          return false;
        }

        it('should not run candidate', () => {
          const experiment = scientist.experiment({
            name: 'disabled1',
            control: ctrl,
            candidate: candidateMock,
            options: {
              publish: publishMock,
              enabled
            }
          });

          experiment('C');

          expect(candidateMock.mock.calls.length).toBe(0);
        });

        it('should return result of control', () => {
          const experiment = scientist.experiment({
            name: 'disabled2',
            control: ctrl,
            candidate: candidateMock,
            options: {
              publish: publishMock,
              enabled
            }
          });

          const result: string = experiment('C');

          expect(result).toBe('Ctrl+C');
        });

        it('should not publish results', () => {
          const experiment = scientist.experiment({
            name: 'disabled3',
            control: ctrl,
            candidate: candidateMock,
            options: {
              publish: publishMock,
              enabled
            }
          });

          experiment('C');

          expect(publishMock.mock.calls.length).toBe(0);
        });
      });

      describe('when enabled returns true', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function enabled(_: string): boolean {
          return true;
        }

        it('should run candidate', () => {
          const experiment = scientist.experiment({
            name: 'enabled1',
            control: ctrl,
            candidate: candidateMock,
            options: {
              publish: publishMock,
              enabled
            }
          });

          experiment('C');

          expect(candidateMock.mock.calls.length).toBe(1);
        });

        it('should return result of control', () => {
          const experiment = scientist.experiment({
            name: 'enabled2',
            control: ctrl,
            candidate: candidateMock,
            options: {
              publish: publishMock,
              enabled
            }
          });

          const result: string = experiment('C');

          expect(result).toBe('Ctrl+C');
        });

        it('should publish results', () => {
          const experiment = scientist.experiment({
            name: 'enabled3',
            control: ctrl,
            candidate: candidateMock,
            options: {
              publish: publishMock,
              enabled
            }
          });

          experiment('C');

          expect(publishMock.mock.calls.length).toBe(1);
        });
      });

      describe('when enabled function specified', () => {
        it('should pass experiment params to enabled', () => {
          const enabledMock: jest.Mock<boolean, [string]> = jest
            .fn<boolean, [string]>()
            .mockReturnValue(false);

          const experiment = scientist.experiment({
            name: 'paramsToEnabled',
            control: ctrl,
            candidate: candidateMock,
            options: {
              publish: publishMock,
              enabled: enabledMock
            }
          });

          experiment('myparam');

          expect(enabledMock.mock.calls.length).toBe(1);
          expect(enabledMock.mock.calls[0][0]).toBe('myparam');
        });
      });
    });

    describe('when control throws', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      function ctrl(_: string): string {
        throw new Error('Kaos!');
      }

      describe('when enabled returns false', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function enabled(_: string): boolean {
          return false;
        }

        it('should throw', () => {
          const experiment = scientist.experiment({
            name: 'disabledthrow1',
            control: ctrl,
            candidate: candidateMock,
            options: {
              publish: publishMock,
              enabled
            }
          });

          expect(() => experiment('C')).toThrowError('Kaos!');
        });

        it('should not run candidate', () => {
          const experiment = scientist.experiment({
            name: 'disabledthrow2',
            control: ctrl,
            candidate: candidateMock,
            options: {
              publish: publishMock,
              enabled
            }
          });

          try {
            experiment('C');
          } catch {
            // swallow error
          }

          expect(candidateMock.mock.calls.length).toBe(0);
        });

        it('should not publish results', () => {
          const experiment = scientist.experiment({
            name: 'disabledthrow3',
            control: ctrl,
            candidate: candidateMock,
            options: {
              publish: publishMock,
              enabled
            }
          });

          try {
            experiment('C');
          } catch {
            // swallow error
          }

          expect(publishMock.mock.calls.length).toBe(0);
        });
      });
    });
  });

  describe('when default options are used', () => {
    function ctrl(): number {
      return 1;
    }

    function candi(): number {
      return 2;
    }

    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('when no options are specified', () => {
      it('should use sensible defaults', () => {
        const experiment = scientist.experiment({
          name: 'no1',
          control: ctrl,
          candidate: candi
        });

        experiment();

        expect(consoleSpy.mock.calls.length).toBe(1);
        expect(consoleSpy.mock.calls[0][0]).toBe(
          'Experiment no1: difference found'
        );
      });
    });

    describe('when only publish option is specified', () => {
      it('should enable experiment', () => {
        const experiment = scientist.experiment({
          name: 'opt1',
          control: ctrl,
          candidate: candi,
          options: {
            publish: publishMock
          }
        });

        experiment();

        expect(publishMock.mock.calls.length).toBe(1);
        const results = publishMock.mock.calls[0][0];
        expect(results.controlResult).toBe(1);
        expect(results.candidateResult).toBe(2);
      });
    });

    describe('when only enabled option is specified', () => {
      it('should use default publish', () => {
        const experiment = scientist.experiment({
          name: 'opt2',
          control: ctrl,
          candidate: candi,
          options: {
            enabled: (): boolean => true
          }
        });

        experiment();

        expect(consoleSpy.mock.calls.length).toBe(1);
        expect(consoleSpy.mock.calls[0][0]).toBe(
          'Experiment opt2: difference found'
        );
      });

      it('should respect enabled', () => {
        const candidateMock: jest.Mock<number, []> = jest.fn<number, []>();

        const experiment = scientist.experiment({
          name: 'opt3',
          control: ctrl,
          candidate: candidateMock,
          options: {
            enabled: (): boolean => false
          }
        });

        experiment();

        expect(consoleSpy.mock.calls.length).toBe(0);
        expect(candidateMock.mock.calls.length).toBe(0);
      });
    });
  });
});

describe('Experiment (async)', () => {
  const sleep = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

  describe('when functions are equivalent', () => {
    async function sum(a: number, b: number): Promise<number> {
      await sleep(250);
      return a + b;
    }

    async function sum2(a: number, b: number): Promise<number> {
      await sleep(125);
      return b + a;
    }

    it('should await result', async () => {
      const experiment = scientist.experiment({
        name: 'async equivalent1',
        control: sum,
        candidate: sum2
      });

      const result: number = await experiment(1, 2);

      expect(result).toBe(3);
    });
  });
});
