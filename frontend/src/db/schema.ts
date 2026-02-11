import {
  pgTable,
  text,
  serial,
  timestamp,
  jsonb,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- 1. Users Table ---
// --- 1. Users Table (Updated) ---
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"), // <--- Add this line
  image: text("image"),
  preferences: jsonb("preferences").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 2. Clubs Table ---
export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  // Unique micro-page theming (Charcoal & Red)
  primaryColor: text("primary_color").default("#121212"),
  accentColor: text("accent_color").default("#FF0000"),
  // Tags for recommendation engine overlap
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 3. Club Members (Junction Table) ---
export const clubMembers = pgTable(
  "club_members",
  {
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    clubId: integer("club_id").references(() => clubs.id, {
      onDelete: "cascade",
    }),
    role: text("role", { enum: ["student", "admin"] }).default("student"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.clubId] }),
  }),
);

// --- 4. Posts Table (FYP/Feed) ---
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubs.id, {
    onDelete: "cascade",
  }),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 5. Projects Table (Collab Hub) ---
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  authorId: text("author_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  // Requirements for matching: ["React", "Python"]
  requirements: jsonb("requirements").$type<string[]>().default([]),
  status: text("status").default("open"),
  startDate: timestamp("start_date"),
  contactInfo: text("contact_info").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 6. Project Collaborators (Junction Table) ---
export const projectCollaborators = pgTable(
  "project_collaborators",
  {
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.projectId] }),
  }),
);

// --- RELATIONS (Fixed for Typescript) ---

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(clubMembers),
  ownedProjects: many(projects),
  collaborations: many(projectCollaborators),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  members: many(clubMembers),
  posts: many(posts),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  author: one(users, { fields: [projects.authorId], references: [users.id] }),
  collaborators: many(projectCollaborators),
}));

export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
  user: one(users, { fields: [clubMembers.userId], references: [users.id] }),
  club: one(clubs, { fields: [clubMembers.clubId], references: [clubs.id] }),
}));

export const projectCollaboratorsRelations = relations(
  projectCollaborators,
  ({ one }) => ({
    user: one(users, {
      fields: [projectCollaborators.userId],
      references: [users.id],
    }),
    project: one(projects, {
      fields: [projectCollaborators.projectId],
      references: [projects.id],
    }),
  }),
);
