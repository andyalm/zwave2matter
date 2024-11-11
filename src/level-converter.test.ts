import { LevelConverter } from './level-converter';

let levelConverter: LevelConverter;

describe('LevelConverter', () => {
  beforeEach(() => {
    levelConverter = new LevelConverter(0, 99);
  });

  test('should convert zwave to matter level', () => {
    const matterLevel = levelConverter.toMatterLevel(35);

    expect(matterLevel).toBe(90);
  });
});
