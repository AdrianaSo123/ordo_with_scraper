import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  RegisterUserInteractor,
  ValidationError,
  DuplicateEmailError,
} from "./RegisterUserInteractor";
import type { UserRepository } from "./UserRepository";
import type { SessionRepository } from "./SessionRepository";
import type { PasswordHasher } from "./PasswordHasher";

describe("RegisterUserInteractor", () => {
  let userRepo: UserRepository;
  let sessionRepo: SessionRepository;
  let hasher: PasswordHasher;
  let interactor: RegisterUserInteractor;

  beforeEach(() => {
    userRepo = {
      create: vi.fn().mockResolvedValue({
        id: "usr_new",
        email: "alice@example.com",
        name: "Alice",
        roles: ["AUTHENTICATED"],
      }),
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
    };
    sessionRepo = {
      create: vi.fn().mockResolvedValue(undefined),
      findByToken: vi.fn(),
      delete: vi.fn(),
      deleteExpired: vi.fn(),
    };
    hasher = {
      hash: vi.fn().mockResolvedValue("$2a$12$hashed"),
      verify: vi.fn(),
    };
    interactor = new RegisterUserInteractor(userRepo, hasher, sessionRepo);
  });

  // TEST-REG-01
  it("successful registration returns user and session token", async () => {
    const result = await interactor.execute({
      email: "alice@example.com",
      password: "securepass1",
      name: "Alice",
    });

    expect(result.user).toEqual({
      id: "usr_new",
      email: "alice@example.com",
      name: "Alice",
      roles: ["AUTHENTICATED"],
    });
    expect(result.sessionToken).toBeDefined();
    expect(typeof result.sessionToken).toBe("string");
    expect(result.sessionToken.length).toBeGreaterThan(0);
    expect(userRepo.create).toHaveBeenCalledWith({
      email: "alice@example.com",
      name: "Alice",
      passwordHash: "$2a$12$hashed",
    });
    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "usr_new",
      }),
    );
  });

  // TEST-REG-02
  it("rejects duplicate email", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue({
      id: "usr_existing",
      email: "alice@example.com",
      name: "Alice",
      passwordHash: "$2a$12$hashed",
      roles: ["AUTHENTICATED"],
    });

    await expect(
      interactor.execute({
        email: "alice@example.com",
        password: "securepass1",
        name: "Alice",
      }),
    ).rejects.toThrow(DuplicateEmailError);
    expect(userRepo.create).not.toHaveBeenCalled();
    expect(sessionRepo.create).not.toHaveBeenCalled();
  });

  // TEST-REG-03
  it("rejects password shorter than 8 characters", async () => {
    await expect(
      interactor.execute({
        email: "alice@example.com",
        password: "short",
        name: "Alice",
      }),
    ).rejects.toThrow(ValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  // TEST-REG-04
  it("rejects password longer than 72 characters", async () => {
    await expect(
      interactor.execute({
        email: "alice@example.com",
        password: "a".repeat(73),
        name: "Alice",
      }),
    ).rejects.toThrow(ValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  // TEST-REG-05
  it("rejects invalid email format", async () => {
    await expect(
      interactor.execute({
        email: "not-an-email",
        password: "securepass1",
        name: "Alice",
      }),
    ).rejects.toThrow(ValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  // TEST-REG-06
  it("rejects empty name", async () => {
    await expect(
      interactor.execute({
        email: "alice@example.com",
        password: "securepass1",
        name: "",
      }),
    ).rejects.toThrow(ValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  // TEST-REG-07
  it("rejects name longer than 100 characters", async () => {
    await expect(
      interactor.execute({
        email: "alice@example.com",
        password: "securepass1",
        name: "a".repeat(101),
      }),
    ).rejects.toThrow(ValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  // TEST-REG-08
  it("rejects missing required fields", async () => {
    await expect(
      interactor.execute({
        email: "",
        password: "",
        name: "",
      }),
    ).rejects.toThrow(ValidationError);
    expect(userRepo.create).not.toHaveBeenCalled();
  });
});
