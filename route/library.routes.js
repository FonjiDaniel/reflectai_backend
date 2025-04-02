const express = require("express");
const libraryController = require("../controllers/libraryController.js");
const auth = require("../middlewares/auth.middleware.js");

const libraryRoutes = express.Router();

// Get libraries for the current user
libraryRoutes.get("/libraries", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const libraries = await libraryController.getAllForUser(userId);
    res.json(libraries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific library content for editing
libraryRoutes.get("/library/content/:id", auth, async (req, res) => {
  try {
    const contentId = req.params.id;
    const item = await libraryController.getLibraryContent(contentId);
    if (!item) {
      return res.status(404).json({ message: "Library not found" });
    }
    res.json(item);
  } catch (er) {
    console.log(er);
    res.status(500).json({ message: "Server error" });
  }
});

// Edit a specific library item
libraryRoutes.put("/library/content/:id", auth, async (req, res) => {
  try {
    const contentId = req.params.id;
    const { title, content, metadata } = req.body;
    if (!title && !content && !metadata)
      return res.status(400).json({
        message: "At least one field (title, metadata, or content) is required",
      });

    const updatedContent = await libraryController.updateLibraryContent(
      contentId,
      title,
      content,
      metadata
    );
    if (!updatedContent)
      return res
        .status(404)
        .json({ message: "Content item not found or update failed" });

    res.json(updatedContent);
  } catch (er) {
    console.log(er);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new library
libraryRoutes.post("/library", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      icon,
      createdBy,
      color,
      parentId,
      isPublic,
      aiGenerated,
      aiPrompt,
      aiSettings,
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const newLibrary = await libraryController.create({
      title,
      description,
      icon,
      color,
      createdBy,
      parentId,
      isPublic,
      aiGenerated,
      aiPrompt,
      aiSettings,
    });

    res.status(201).json(newLibrary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific library
libraryRoutes.get("/libraries/:id", auth, async (req, res) => {
  try {
    const library = await libraryController.getById(req.params.id, req.user.id);

    if (!library) {
      return res
        .status(404)
        .json({ message: "Library not found or access denied" });
    }

    // Get additional data
    const [tags, collaborators, children] = await Promise.all([
      libraryController.getTags(req.params.id),
      library.is_owner ? libraryController.getCollaborators(req.params.id) : [],
      libraryController.getChildren(req.params.id, req.user.id),
    ]);

    res.json({
      ...library,
      tags,
      collaborators,
      children,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a library
libraryRoutes.put("/:id", auth, async (req, res) => {
  try {
    // First check if user has access to update
    const library = await libraryController.getById(req.params.id, req.user.id);

    if (!library) {
      return res.status(404).json({ message: "Library not found" });
    }

    if (
      library.created_by !== req.user.id &&
      library.permission !== "write" &&
      library.permission !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this library" });
    }

    const {
      title,
      description,
      icon,
      color,
      parentId,
      displayOrder,
      isPublic,
    } = req.body;

    const updatedLibrary = await libraryController.update(req.params.id, {
      title,
      description,
      icon,
      color,
      lastEditedBy: req.user.id,
      parentId,
      displayOrder,
      isPublic,
    });

    res.json(updatedLibrary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a library
libraryRoutes.delete("/library/delete/:id", auth, async (req, res) => {
  try {
    const library = await libraryController.getById(
      req.params.id,
      req.user.userId
    );
    console.log("Current user is", req.user.userId);

    if (!library) {
      return res.status(404).json({ message: "Library not found" });
    }

    if (library.created_by !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this library" });
    }

    await libraryController.delete(req.params.id);
    res.json(library);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add tag to library
libraryRoutes.post("/:id/tags", auth, async (req, res) => {
  try {
    const library = await libraryController.getById(req.params.id, req.user.id);

    if (
      !library ||
      (library.created_by !== req.user.id &&
        library.permission !== "write" &&
        library.permission !== "admin")
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { name, color } = req.body;

    await libraryController.addTag(req.params.id, name, color);
    const tags = await libraryController.getTags(req.params.id);

    res.json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add collaborator to a library
libraryRoutes.post("/:id/collaborators", auth, async (req, res) => {
  try {
    const library = await libraryController.getById(req.params.id, req.user.id);

    if (!library || library.created_by !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the owner can add collaborators" });
    }

    const { userId, permission } = req.body;

    await libraryController.addCollaborator(req.params.id, userId, permission);
    const collaborators = await libraryController.getCollaborators(
      req.params.id
    );

    res.json(collaborators);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user writing stats
libraryRoutes.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await libraryController.getWritingStats(userId);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user streak
libraryRoutes.get("/streak/:id", auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const userStreak = await libraryController.getUserStreak(userId);

    res.json(userStreak);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = libraryRoutes;
