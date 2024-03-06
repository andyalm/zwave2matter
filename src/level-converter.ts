export class LevelConverter {
  static readonly MatterMinLevel = 0;
  static readonly MatterMaxLevel = 254;

  readonly #zwaveMinLevel: number;
  readonly #zwaveMaxLevel: number;

  constructor(zwaveMinLevel: number, zwaveMaxLevel: number) {
    this.#zwaveMinLevel = zwaveMinLevel;
    this.#zwaveMaxLevel = zwaveMaxLevel;
  }

  toMatterLevel(zwaveLevel: number): number {
    return Math.round(
      ((zwaveLevel - this.#zwaveMinLevel) / (this.#zwaveMaxLevel - this.#zwaveMinLevel)) *
        (LevelConverter.MatterMaxLevel - LevelConverter.MatterMinLevel) +
        LevelConverter.MatterMinLevel
    );
  }

  toZwaveLevel(matterLevel: number): number {
    return Math.round(
      ((matterLevel - LevelConverter.MatterMinLevel) /
        (LevelConverter.MatterMaxLevel - LevelConverter.MatterMinLevel)) *
        (this.#zwaveMaxLevel - this.#zwaveMinLevel) +
        this.#zwaveMinLevel
    );
  }
}
