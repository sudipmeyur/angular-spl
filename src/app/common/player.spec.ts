import { Player } from './player';

describe('Player', () => {
  it('should create an instance', () => {
    expect(new Player('Test Player', 'test.jpg')).toBeTruthy();
  });
});
