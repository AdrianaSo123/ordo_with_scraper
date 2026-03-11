import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AuthenticateUserInteractor,
  InvalidCredentialsError,
} from "./AuthenticateUserInteractor";
import type { UserRepository } from "./UserRepository";
import type { SessionRepository } from "./SessionRepository";
import type { PasswordHasher } from "./PasswordHasher";

describe("AuthenticateUserInteractor", () => {
  let userRepo: UserRepository;
  let sessionRepo: SessionRepository;
  let hasher: PasswordHasher;
  let interactor: AuthenticateUserInteractor;

  const storedUser = {
    id: "usr_alice",
    email: "alice@example.com",
    name: "Alice",
    passwordHash: "$2a$12$realhash",
    roles: ["AUTHENTICATED" as const],
  };

  beforeEach(() => {
    userRepo = {
      create: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(storedUser),
      findById: vi.fn(),
    };
    sessionRepo = {
      create: vi.fn().mockResolvedValue(undefined),
      findByToken: vi.fn(),
      delete: vi.fn(),
      deleteExpired: vi.fn(),
    };
    hasher = {
      hash: vi.fn(),
      verify: vi.fn().mockResolvedValue(true),
    };
    interactor = new AuthenticateUserInteractor(userRepo, hasher, sessionRepo);
  });

  // TEST-LOGIN-01
  it("successful login returns user and session token", async () => {
    const result = await interactor.execute({
      email: "alice@example.com",
      password: "securepass1",
    });

    expect(result.user).toEqual({
      id: "usr_alice",
      email: "alice@example.com",
      name: "Alice",
      roles: ["AUTHENTICATED"],
    });
    expect(result.sessionToken).toBeDefined();
    expect(hasher.verify).toHaveBeenCalledWith("securepass1", "$2a$12$realhash");
    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "usr_alice" }),
    );
  });

  // TEST-LOGIN-02
  it("rejects wrong password", async () => {
    vi.mocked(hasher.verify).mockResolvedValue(false);

    await expect(
      interactor.execute({
        email: "alice@example.com",
        password: "wrongpass",
      }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(sessionRepo.create).not.toHaveBeenCalled();
  });

  // TEST-LOGIN-03
  it("rejects nonexistent email with timing safety", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);
    vi.mocked(hasher.verify).mockResolvedValue(false);

    await expect(
      interactor.execute({
        email: "nobody@example.com",
        password: "anything",
      }),
    ).rejects.toThrow(InvalidCredentialsError);

    // Must still call verify for timing safety
    expect(hasher.verify).toHaveBeenCalled();
    expect(sessionRepo.create).not.toHaveBeenCalled();
  });

  // TEST-LOGIN-04
  it("rejects seed user with null password_hash", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue({
      ...storedUser,
      passwordHash: null,
    });
    vi.mocked(hasher.verify).mockResolvedValue(false);

    await expect(
      interactor.execute({
        email: "admin@example.com",
        password: "anything",
      }),
    ).rejects.toThrow(InvalidCredentialsError);

    // Timing safety: verify still called against dummy hash
    expect(hasher.verify).toHaveBeenCalled();
    expect(sessionRepo.create).not.toHaveBeenCalled();
  });

  // TEST-LOGIN-05
  it("allows multiple active sessions", async () => {
    const result1 = await interactor.execute({
      email: "alice@example.com",
      password: "securepass1",
    });
    const result2 = await interactor.execute({
      email: "alice@example.com",
      password: "securepass1",
    });

    expect(result1.sessionToken).not.toBe(result2.sessionToken);
    expect(sessionRepo.create).toHaveBeenCalledTimes(2);
  });
});
