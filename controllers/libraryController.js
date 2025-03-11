
import pool from "../db.js";

class LibraryController {


  // Create a new library
  async create({ title, description, icon, color, createdBy, parentId, isPublic, aiGenerated, aiPrompt, aiSettings }) {
    const query = `
      INSERT INTO libraries
        (title, description, icon, color, created_by, parent_id, is_public, ai_generated, ai_prompt, ai_settings)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      title, 
      description || null, 
      icon || null, 
      color || null, 
      createdBy, 
      parentId || null, 
      isPublic || false, 
      aiGenerated || false, 
      aiPrompt || null, 
      aiSettings ? JSON.stringify(aiSettings) : null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }



  
  // Get all libraries for a user (including ones they collaborate on)
  async getAllForUser(userId) {
    const query = `
      SELECT DISTINCT l.*
      FROM libraries l
      LEFT JOIN library_collaborators lc ON l.id = lc.library_id
      WHERE l.created_by = $1
      OR lc.user_id = $1
      ORDER BY l.display_order, l.title
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }


  
  //get a specific library content by Id
  async getLibraryContent (id) {
    try {
      const query = `
        SELECT * FROM content_items 
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rowCount === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting content item:', error);
      throw error;
    }
  }





  //Update a specific LibraryContent

  async updateLibraryContent (id, title, content, metadata) {

    const query = `
    UPDATE content_items
    SET
      title = COALESCE($1, title),
      content = COALESCE($2, content),
      metadata = COALESCE($3, metadata),
      updated_at = NOW()
    WHERE id = $4
    RETURNING *;  
    `
    const values = [

      title ||  null,
      content || null,
      metadata || null,
      id
    ]

    const result = await pool.query(query, values);
    return result.rowCount > 0? result.rows[0] : null;

  }


  // Get direct children of a library (for hierarchical display)
  async getChildren(parentId, userId) {
    const query = `
      SELECT l.*
      FROM libraries l
      LEFT JOIN library_collaborators lc ON l.id = lc.library_id
      WHERE l.parent_id = $1
      AND (l.created_by = $2 OR lc.user_id = $2 OR l.is_public = true)
      ORDER BY l.display_order, l.title
    `;
    
    const result = await pool.query(query, [parentId, userId]);
    return result.rows;
  }




  
  // Get a single library by ID
  async getById(id, userId) {
    const query = `
      SELECT l.*, 
        (l.created_by = $2) as is_owner,
        COALESCE(lc.permission, 'read') as permission,
        (SELECT COUNT(*) FROM content_items WHERE library_id = $1) as content_count
      FROM libraries l
      LEFT JOIN library_collaborators lc ON l.id = lc.library_id AND lc.user_id = $2
      WHERE l.id = $1
      AND (l.created_by = $2 OR lc.user_id = $2 OR l.is_public = true)
    `;
    
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  }
  


  // Update a library
  async update(id, { title, description, icon, color, lastEditedBy, parentId, displayOrder, isPublic }) {
    const query = `
      UPDATE libraries
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        icon = COALESCE($3, icon),
        color = COALESCE($4, color),
        last_edited_by = $5,
        parent_id = COALESCE($6, parent_id),
        display_order = COALESCE($7, display_order),
        is_public = COALESCE($8, is_public),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;
    
    const values = [
      title, 
      description, 
      icon, 
      color, 
      lastEditedBy, 
      parentId, 
      displayOrder, 
      isPublic,
      id
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  

  async delete(id) {
    const query = 'DELETE FROM libraries WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  
 
  async addTag(libraryId, tagName, tagColor = null) {
    // First, ensure the tag exists or create it
    const createTagQuery = `
      INSERT INTO tags (name, color) 
      VALUES ($1, $2)
      ON CONFLICT (name) DO UPDATE SET color = COALESCE($2, tags.color)
      RETURNING id
    `;
    
    const tagResult = await pool.query(createTagQuery, [tagName, tagColor]);
    const tagId = tagResult.rows[0].id;
    
    // Then link it to the library
    const linkQuery = `
      INSERT INTO library_tags (library_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `;
    
    await pool.query(linkQuery, [libraryId, tagId]);
    return true;
  }


  
  // Get tags for a library
  async getTags(libraryId) {
    const query = `
      SELECT t.*
      FROM tags t
      JOIN library_tags lt ON t.id = lt.tag_id
      WHERE lt.library_id = $1
    `;
    
    const result = await pool.query(query, [libraryId]);
    return result.rows;
  }
  

  // Add a collaborator to a library
  async addCollaborator(libraryId, userId, permission = 'read') {
    const query = `
      INSERT INTO library_collaborators (library_id, user_id, permission)
      VALUES ($1, $2, $3)
      ON CONFLICT (library_id, user_id) DO UPDATE SET permission = $3
    `;
    
    await pool.query(query, [libraryId, userId, permission]);
    return true;
  }


  
  // Get all collaborators for a library
  async getCollaborators(libraryId) {
    const query = `
      SELECT u.id, u.name, u.email, lc.permission
      FROM users u
      JOIN library_collaborators lc ON u.id = lc.user_id
      WHERE lc.library_id = $1
    `;
    
    const result = await pool.query(query, [libraryId]);
    return result.rows;
  }
}


export default new LibraryController();