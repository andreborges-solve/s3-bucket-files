import { UserService } from '../src/user/user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('cria novo usuário se ele não existir', async () => {
    const profile = {
      email: 'novo@teste.com',
      externalId: 'ext-123',
      authProvider: 'genesys',
      displayName: 'Novo Usuário',
    };

    const user = await userService.findOrCreateExternalUser(profile);

    expect(user).toBeDefined();
    expect(user.id).toBeGreaterThan(0);
    expect(user.email).toBe(profile.email);
    expect(user.externalId).toBe(profile.externalId);
  });

  it('retorna o usuário existente sem duplicar registros', async () => {
    const profile = {
      email: 'existente@teste.com',
      externalId: 'ext-456',
      authProvider: 'genesys',
      displayName: 'Usuário Existente',
    };

    const user1 = await userService.findOrCreateExternalUser(profile);
    const user2 = await userService.findOrCreateExternalUser(profile);

    expect(user1.id).toBe(user2.id);
    expect(user1.email).toBe(user2.email);
  });

  it('busca usuário por id existente', async () => {
    const profile = {
      email: 'busca@teste.com',
      externalId: 'ext-789',
      authProvider: 'genesys',
      displayName: 'Usuário Busca',
    };

    const created = await userService.findOrCreateExternalUser(profile);
    const found = await userService.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.email).toBe(profile.email);
  });

  it('retorna null se buscar id inexistente', async () => {
    const found = await userService.findById(999999);
    expect(found).toBeNull();
  });
});
