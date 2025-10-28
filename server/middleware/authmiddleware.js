// server/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Project from "../models/project.js";

/**
 * Middleware to verify JWT token and authenticate user
 * Adds req.user to the request object
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user without password
    req.user = await User.findById(decoded.id).select("-password");
    
    if (!req.user) {
      throw new Error("User not found");
    }
    
    next();
  } catch (err) {
    res.status(401).json({ 
      message: "Token invalid or expired",
      error: err.message 
    });
  }
};

/**
 * Middleware to check if user is a member or owner of a project
 * Must be used after protect middleware
 * Expects req.params.projectId
 */
export const checkProjectMembership = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: "Project ID required" });
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is owner or member
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ 
        message: "Access denied. You are not a member of this project." 
      });
    }

    // Attach project and role to request for use in controller
    req.project = project;
    req.isOwner = isOwner;
    
    next();
  } catch (err) {
    res.status(500).json({ 
      message: "Error checking project membership",
      error: err.message 
    });
  }
};

/**
 * Middleware to check if user is the owner of a project
 * Must be used after protect middleware
 * Used for operations like delete, add/remove members
 */
export const checkProjectOwnership = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: "Project ID required" });
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is owner
    const isOwner = project.owner.toString() === req.user._id.toString();

    if (!isOwner) {
      return res.status(403).json({ 
        message: "Access denied. Only project owner can perform this action." 
      });
    }

    // Attach project to request
    req.project = project;
    
    next();
  } catch (err) {
    res.status(500).json({ 
      message: "Error checking project ownership",
      error: err.message 
    });
  }
};
