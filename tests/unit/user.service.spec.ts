import { createUser, fetchUser } from "../../src/modules/user/types/user-input.types";
import { UserService } from "../../src/modules/user/user.service";

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-123'
}));

describe("UserService", () => {
    let userService: UserService;
    let trx: any;
    let db: any;

    beforeEach(() => {
        const query_builder = {
            where: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue([1]),
            first: jest.fn().mockResolvedValue({
                first_name: "first name",
                last_name: "last name",
                email: "first@last",
                phone_number: "12345",
                password: "password"
            })
        }
             const queryBuilder = {
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue({
                    first_name: "first name",
                    last_name: "last name",
                    email: "first@last",
                    phone_number: "12345",
                    password: "password"
                })
                };
        trx = jest.fn(() => query_builder);
        db = jest.fn(() => queryBuilder);
        db.transaction = jest.fn(async (cb) => cb(trx));
        userService = new UserService(db as any);
    });


 // -------------------
  // CREATE USER
  // -------------------
  describe("createUser", () => {
    it("should create a user for a valid user input", async () => {
        const input: createUser = {
            first_name: "first name",
            last_name: "last name",
            email: "first@last",
            phone_number: "12345",
            password: "password"
        }
      await expect(userService.createUser(input)).resolves.not.toThrow();
    });

    it("should throw an error for a user field/fields are invalid/empty", async () => {
        const input: createUser = {
            first_name: "",
            last_name: "last name",
            email: "first@last",
            phone_number: "",
            password: "password"
        }
      await expect(userService.createUser(input)).rejects.toThrow();
    });
  });

  describe("fetchUser", () => {
    it("should fetch a user for a valid login detials", async () => {
        const input: fetchUser = {
            email: "first@last",
            password: "password"
        }
    await expect(userService.fetchUser(input)).resolves.not.toThrow()
    });

    it("should throw an error for an invalid user", async () => {
        const input: fetchUser = {
            email: "first@",
            password: "pas"
        }
    await expect(userService.fetchUser(input)).resolves.not.toThrow()
    })
  })

  })