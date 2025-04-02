'use strict';

const pool = require("../db.js");

class LibraryController {
  // Create a new library
  async create({
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
  }) {
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
      aiSettings ? JSON.stringify(aiSettings) : null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get all libraries for a user
  async getAllForUser(userId) {
    const query = `
      SELECT DISTINCT l.*
      FROM libraries l
      LEFT JOIN library_collaborators lc ON l.id = lc.library_id
      WHERE l.created_by = $1
      OR lc.user_id = $1
      ORDER BY l.updated_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  //get a specific library content by Id
  async getLibraryContent(id) {
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
      console.error("Error getting content item:", error);
      throw error;
    }
  }

  //Update a specific LibraryContent
  async updateLibraryContent(id, title, content, metadata, wordCount) {
    const query = `
    UPDATE content_items
    SET
      title = COALESCE($1, title),
      content = COALESCE($2, content),
      metadata = COALESCE($3, metadata),
      word_count = COALESCE($4, word_count),
      updated_at = NOW()
    WHERE id = $5
    RETURNING *;  
    `;
    const values = [
      title || null,
      content || null,
      metadata || null,
      wordCount || 0,
      id,
    ];

    const result = await pool.query(query, values);
    return result.rowCount > 0 ? result.rows[0] : null;
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
      SELECT *, (created_by = $2) AS is_owner
      FROM libraries
      WHERE id = $1
    `;

    const result = await pool.query(query, [id, userId]);
    console.log(result);
    return result.rows[0] || null;
  }

  // Update a library
  async updateLibrary(id, title) {
    const query = `
      UPDATE libraries
      SET 
        title = COALESCE($1, title)
      WHERE id = $2
      RETURNING * 
    `;

    const values = [title, id];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    try {
      const query = "DELETE FROM libraries WHERE id = $1 RETURNING *";
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (err) {
      console.log(err);
    }
  }

  async getWritingStats(userId) {
    const query = `SELECT * FROM daily_word_counts 
  WHERE user_id = $1 
  ORDER BY entry_date ASC`;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async getUserStreak(userId) {
    const query = `SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = $1 `;


    const result = await pool.query(query, [userId]);

    console.log("the current streak is : " , result);
    return result.rows;
  }
}

module.exports = new LibraryController();