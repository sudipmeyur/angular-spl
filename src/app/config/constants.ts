import { environment } from '../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl || 'http://localhost:8080/api';
export const PLAYERS_URL = `${API_BASE_URL}/players`;
export const PLAYER_TEAMS_URL = `${API_BASE_URL}/player-teams`;
export const TEAM_SEASONS_URL = `${API_BASE_URL}/team-seasons`;
export const SEASONS_URL = `${API_BASE_URL}/seasons`;
export const PLAYER_LEVELS_URL = `${API_BASE_URL}/player-levels`;
export const PLAYER_CATAGORY_URL = `${API_BASE_URL}/player-categories`;

// Amount increment configuration
export const AMOUNT_INCREMENT_STEP = 0.25; // Amount increment/decrement step value

