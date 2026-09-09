import User from '../models/User.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const publicUserFields = 'username displayName avatarUrl isOnline lastSeen';
const USER_PAGE_SIZE = 30;

function publicUserQuery(currentUser) {
  return {
    _id: { $in: currentUser.contacts || [], $nin: currentUser.blockedUsers || [] },
    isSystemBot: false,
    blockedUsers: { $ne: currentUser._id },
  };
}

/** POST /api/users/contacts */
export async function addContactByEmail(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    const contact = await User.findOne({ email, isSystemBot: false }).select(`${publicUserFields} email blockedUsers`);
    if (!contact) return res.status(404).json({ message: 'No ChatlyAI account uses that email address.' });
    if (contact._id.equals(req.user._id)) return res.status(400).json({ message: 'You cannot add yourself as a contact.' });
    if ((req.user.blockedUsers || []).some((id) => id.equals(contact._id)) || (contact.blockedUsers || []).some((id) => id.equals(req.user._id))) return res.status(403).json({ message: 'This contact is unavailable.' });
    await User.updateOne({ _id: req.user._id }, { $addToSet: { contacts: contact._id } });
    return res.status(201).json({ message: 'Contact added.', user: contact });
  } catch (error) { return next(error); }
}

/** DELETE /api/users/contacts/:userId */
export async function removeContact(req, res, next) {
  try {
    await User.updateOne({ _id: req.user._id }, { $pull: { contacts: req.params.userId } });
    return res.json({ message: 'Contact removed.', userId: req.params.userId });
  } catch (error) { return next(error); }
}

function decodeUserCursor(cursor) {
  if (!cursor) return null;

  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (typeof decoded.username !== 'string' || !decoded.username || typeof decoded.id !== 'string' || !/^[a-f\d]{24}$/i.test(decoded.id)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function encodeUserCursor(user) {
  return Buffer.from(JSON.stringify({ username: user.username, id: user._id.toString() })).toString('base64url');
}

function getUserPageFilter(cursor) {
  if (!cursor) return {};
  return {
    $or: [
      { username: { $gt: cursor.username } },
      { username: cursor.username, _id: { $gt: cursor.id } },
    ],
  };
}

async function findUserPage(query, cursor) {
  const users = await User.find(query)
    .select(publicUserFields)
    .sort({ username: 1, _id: 1 })
    .limit(USER_PAGE_SIZE + 1)
    .lean();
  const hasMore = users.length > USER_PAGE_SIZE;
  const page = hasMore ? users.slice(0, USER_PAGE_SIZE) : users;
  return { users: page, nextCursor: hasMore ? encodeUserCursor(page.at(-1)) : null };
}

/** GET /api/users */
export async function getUsers(req, res, next) {
  try {
    const cursor = decodeUserCursor(req.query.cursor);
    if (req.query.cursor && !cursor) return res.status(400).json({ message: 'Invalid user cursor.' });
    const page = await findUserPage({ ...publicUserQuery(req.user), ...getUserPageFilter(cursor) });

    return res.json(page);
  } catch (error) {
    return next(error);
  }
}

/** GET /api/users/search?query=... */
export async function searchUsers(req, res, next) {
  try {
    const query = req.query.query.trim();
    const searchPattern = new RegExp(escapeRegex(query), 'i');

    const cursor = decodeUserCursor(req.query.cursor);
    if (req.query.cursor && !cursor) return res.status(400).json({ message: 'Invalid user cursor.' });
    const page = await findUserPage({
      ...publicUserQuery(req.user),
      $and: [
        { $or: [{ username: searchPattern }, { displayName: searchPattern }] },
        getUserPageFilter(cursor),
      ],
    });

    return res.json(page);
  } catch (error) {
    return next(error);
  }
}

/** GET /api/users/blocked */
export async function getBlockedUsers(req, res, next) {
  try {
    const users = await User.find({ _id: { $in: req.user.blockedUsers || [] } })
      .select(publicUserFields)
      .sort({ username: 1 })
      .lean();
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
}

/** PUT /api/users/:userId/block */
export async function blockUser(req, res, next) {
  try {
    if (req.user._id.equals(req.params.userId)) return res.status(400).json({ message: 'You cannot block yourself.' });

    const userToBlock = await User.findOne({ _id: req.params.userId, isSystemBot: false }).select(publicUserFields);
    if (!userToBlock) return res.status(404).json({ message: 'User not found.' });

    await User.updateOne({ _id: req.user._id }, { $addToSet: { blockedUsers: userToBlock._id } });
    return res.json({ message: 'User blocked.', user: userToBlock });
  } catch (error) {
    return next(error);
  }
}

/** DELETE /api/users/:userId/block */
export async function unblockUser(req, res, next) {
  try {
    await User.updateOne({ _id: req.user._id }, { $pull: { blockedUsers: req.params.userId } });
    return res.json({ message: 'User unblocked.', userId: req.params.userId });
  } catch (error) {
    return next(error);
  }
}
