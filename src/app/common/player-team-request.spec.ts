import { PlayerTeamRequest } from './player-team-request';

describe('PlayerTeamRequest', () => {
  it('should create an instance', () => {
    const request = new PlayerTeamRequest('P001', 'T001', 'S6', 1000000);
    expect(request).toBeTruthy();
  });

  it('should set all properties correctly', () => {
    const request = new PlayerTeamRequest('P001', 'T001', 'S6', 1000000, 'PT001');
    expect(request.code).toBe('PT001');
    expect(request.playerCode).toBe('P001');
    expect(request.teamCode).toBe('T001');
    expect(request.seasonCode).toBe('S6');
    expect(request.soldAmount).toBe(1000000);
  });

  it('should create instance without code', () => {
    const request = new PlayerTeamRequest('P001', 'T001', 'S6', 1000000);
    expect(request.code).toBeUndefined();
    expect(request.playerCode).toBe('P001');
  });
});
