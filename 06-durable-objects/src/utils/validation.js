// 参数验证工具
export function validateRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    return false;
  }

  if (roomId.trim().length === 0 || roomId.length > 100) {
    return false;
  }

  return true;
}

export function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return false;
  }

  if (message.trim().length === 0 || message.length > 10000) {
    return false;
  }

  return true;
}

export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return false;
  }

  if (username.trim().length === 0 || username.length > 50) {
    return false;
  }

  return true;
}

export function validateCounterName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const regex = /^[a-zA-Z0-9_-]+$/;
  return regex.test(name) && name.length <= 100;
}

export function validateGameId(gameId) {
  if (!gameId || typeof gameId !== 'string') {
    return false;
  }

  return gameId.length >= 8 && gameId.length <= 36;
}

