export interface UserProfile {
  email: string;
  externalId: string;
  authProvider: string;
  displayName: string;
}

export interface User {
  id: number;
  email: string;
  externalId: string;
  authProvider: string;
  displayName: string;
  createdAt: Date;
}

// repositório em memória — substituir por MySQL quando estiver pronto
const users: User[] = [];
let nextId = 1;

export class UserService {
  async findOrCreateExternalUser(profile: UserProfile): Promise<User> {
    let user = users.find((u) => u.externalId === profile.externalId);

    if (!user) {
      user = {
        id: nextId++,
        email: profile.email,
        externalId: profile.externalId,
        authProvider: profile.authProvider,
        displayName: profile.displayName,
        createdAt: new Date(),
      };
      users.push(user);
    }

    return user;
  }

  async findById(id: number): Promise<User | null> {
    return users.find((u) => u.id === id) ?? null;
  }
}
