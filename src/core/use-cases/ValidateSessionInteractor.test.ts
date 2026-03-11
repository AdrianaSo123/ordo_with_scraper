import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ValidateSessionInteractor,
  InvalidSessionError,
} from "./ValidateSessionInteractor";
import type { SessionRepository } from "./SessionRepository";
import type { UserRepository } from "./UserRepository";

describe("ValidateSessionInteractor", () => {
  let sessionRepo: SessionRepository;
  let userRepo: UserRepository;
  let interactor: ValidateSessionInteractor;

  const validSession = {
    id: "tok_valid",
    userId: "usr_alice",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const aliceUser = {
    id: "usr_alice",
    email: "alice@example.com",
    name: "Alice",
    roles: ["AUTHENTICATED" as const],
  };

  beforeEach(() => {
    sessionRepo = {
      create: vi.fn(),
      findByToken: vi.fn().mockResolvedValue(validSession),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteExpired: vi.fn(),
    };
    userRepo = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn().mockResolvedValue(aliceUser),
    };
    interactor = new ValidateSessionInteractor(sessionRepo, userRepo);
  });

  // TEST-SESS-01
  it("returns user for valid session", async () => {
    const user = await interactor.execute({ token: "tok_valid" });

    expect(user).toEqual(aliceUser);
    expect(sessionRepo.findByToken).toHaveBeenCalledWith("tok_valid");
    expect(userRepo.findById).toHaveBeenCalledWith("usr_alice");
  });

  // TEST-SESS-02
  it("rejects expired session", async () => {
    vi.mocked(sessionRepo.findByToken).mockResolvedValue({
      ...validSession,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });

    await expect(
      interactor.execute({ token: "tok_expired" }),
    ).rejects.toThrow(InvalidSessionError);
    expect(sessionRepo.delete).toHaveBeenCalled();
  });

  // TEST-SESS-03
  it("rejects invalid token", async () => {
    vi.mocked(sessionRepo.findByToken).mockResolvedValue(null);

    await expect(
      interactor.execute({ token: "random-garbage" }),
    ).rejects.toThrow(InvalidSessionError);
  });

  // TEST-SESS-04
  it("rejects when user no longer exists", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    await expect(
      interactor.execute({ token: "tok_valid" }),
    ).rejects.toThrow(InvalidSessionError);
    expect(sessionRepo.delete).toHaveBeenCalled();
  });
});
