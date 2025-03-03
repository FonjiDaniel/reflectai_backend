
import express from 'express';
import libraryController from '../controllers/libraryController.js';
import auth from '../middlewares/auth.middleware.js'; 

const libraryRoutes = express.Router(); 

// Get all libraries for current user
libraryRoutes.get('/libraries', auth, async (req, res) => {
  try {
    const libraries = await libraryController.getAllForUser(req.user.id);
    res.json(libraries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Create a new library
libraryRoutes.post('/', auth, async (req, res) => {
  try {
    const { title, description, icon, color, parentId, isPublic, aiGenerated, aiPrompt, aiSettings } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const newLibrary = await libraryController.create({
      title,
      description,
      icon,
      color,
      createdBy: req.user.id,
      parentId,
      isPublic,
      aiGenerated,
      aiPrompt,
      aiSettings
    });
    
    res.status(201).json(newLibrary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific library
libraryRoutes.get('/:id', auth, async (req, res) => {
  try {
    const library = await libraryController.getById(req.params.id, req.user.id);
    
    if (!library) {
      return res.status(404).json({ message: 'Library not found or access denied' });
    }
    
    // Get additional data
    const [tags, collaborators, children] = await Promise.all([
      libraryController.getTags(req.params.id),
      library.is_owner ? libraryController.getCollaborators(req.params.id) : [],
      libraryController.getChildren(req.params.id, req.user.id)
    ]);
    
    res.json({
      ...library,
      tags,
      collaborators,
      children
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a library
libraryRoutes.put('/:id', auth, async (req, res) => {
  try {
    // First check if user has access to update
    const library = await libraryController.getById(req.params.id, req.user.id);
    
    if (!library) {
      return res.status(404).json({ message: 'Library not found' });
    }
    
    if (library.created_by !== req.user.id && library.permission !== 'write' && library.permission !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this library' });
    }
    
    const { title, description, icon, color, parentId, displayOrder, isPublic } = req.body;
    
    const updatedLibrary = await libraryController.update(req.params.id, {
      title,
      description,
      icon,
      color,
      lastEditedBy: req.user.id,
      parentId,
      displayOrder,
      isPublic
    });
    
    res.json(updatedLibrary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a library
libraryRoutes.delete('/:id', auth, async (req, res) => {
  try {
    const library = await libraryController.getById(req.params.id, req.user.id);
    
    if (!library) {
      return res.status(404).json({ message: 'Library not found' });
    }
    
    if (library.created_by !== req.user.id && library.permission !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this library' });
    }
    
    await libraryController.delete(req.params.id);
    res.json({ message: 'Library deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add tag to library
libraryRoutes.post('/:id/tags', auth, async (req, res) => {
  try {
    const library = await libraryController.getById(req.params.id, req.user.id);
    
    if (!library || (library.created_by !== req.user.id && library.permission !== 'write' && library.permission !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { name, color } = req.body;
    
    await libraryController.addTag(req.params.id, name, color);
    const tags = await libraryController.getTags(req.params.id);
    
    res.json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


libraryRoutes.post('/:id/collaborators', auth, async (req, res) => {
  try {
    const library = await libraryController.getById(req.params.id, req.user.id);
    
    if (!library || library.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can add collaborators' });
    }
    
    const { userId, permission } = req.body;
    
    await libraryController.addCollaborator(req.params.id, userId, permission);
    const collaborators = await libraryController.getCollaborators(req.params.id);
    
    res.json(collaborators);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default libraryRoutes;