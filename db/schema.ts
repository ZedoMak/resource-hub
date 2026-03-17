import { pgTable, timestamp, boolean, text,integer, pgEnum, index, unique } from "drizzle-orm/pg-core";

export const user = pgTable("users", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
})

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at'),
});


export const resourceTypeEnum = pgEnum("resource_type", ["EXAM", "NOTE", "SUMMARY", "ASSIGNMENT"]);

export const universities = pgTable("universities", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  code: text("code").notNull(), // e.g., "CS201"
  name: text("name").notNull(),
  universityId: text("university_id").notNull().references(() => universities.id),
});

export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: text("file_key").notNull(), // Useful for deleting from S3/UploadThing
  type: resourceTypeEnum("type").default("EXAM").notNull(),
  
  // Stats for the Ranking System
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  downloads: integer("downloads").default(0).notNull(),
  score: integer("score").default(0).notNull(), // (upvotes * 3 + downloads - downvotes * 2)

  userId: text("user_id").notNull().references(() => user.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Indexing the score and courseId for fast searching/sorting
    scoreIdx: index("score_idx").on(table.score),
    courseIdx: index("course_idx").on(table.courseId),
  };
});

export const voteTypeEnum = pgEnum("vote_type", ["UP", "DOWN"]);

export const votes = pgTable("votes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  resourceId: text("resource_id").notNull().references(() => resources.id),
  type: voteTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // This is the most important line for data integrity:
  uniqueVote: unique().on(table.userId, table.resourceId),
}));