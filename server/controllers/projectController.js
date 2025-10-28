// server/controllers/projectController.js
import Project from "../models/project.js";
import User from "../models/user.js";
import Task from "../models/task.js";

/**
 * Create a new project (Express controller)
 * Uses authenticated user from req.user
 */
export const createProject = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const ownerId = req.user._id;

    const project = await Project.create({
      name,
      description,
      owner: ownerId,
      members: [ownerId, ...(members || [])],
    });

    // Add project to user.projects arrays
    await User.updateMany(
      { _id: { $in: project.members } },
      { $addToSet: { projects: project._id } }
    );

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all projects where user is a member
 */
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user._id })
      .populate("owner", "name email")
      .populate("members", "name email");
    
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get single project by ID
 * Verifies user is a member before returning
 */
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("members", "name email")
      .populate("owner", "name email")
      .populate("tasks");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is a member
    const isMember = project.members.some(
      member => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update project details (owner only)
 */
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can edit
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only owner can edit project" });
    }

    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;
    
    await project.save();
    
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete project (owner only)
 * Also deletes all associated tasks
 */
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can delete
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only owner can delete project" });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ project: req.params.id });

    // Remove project reference from all members' projects arrays
    await User.updateMany(
      { _id: { $in: project.members } },
      { $pull: { projects: req.params.id } }
    );

    // Delete the project
    await project.deleteOne();
    
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Add member to project (owner only)
 */
export const addMemberToProject = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can add members
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only owner can add members" });
    }

    // Check if user is already a member
    if (project.members.includes(userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Add member to project
    project.members.push(userId);
    await project.save();

    // Add project to user's projects array
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { projects: project._id } }
    );

    res.json({ message: "Member added successfully", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Remove member from project (owner only)
 */
export const removeMemberFromProject = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can remove members
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only owner can remove members" });
    }

    // Cannot remove owner
    if (userId === project.owner.toString()) {
      return res.status(400).json({ message: "Cannot remove project owner" });
    }

    // Remove member from project
    project.members = project.members.filter(
      member => member.toString() !== userId
    );
    await project.save();

    // Remove project from user's projects array
    await User.findByIdAndUpdate(
      userId,
      { $pull: { projects: project._id } }
    );

    res.json({ message: "Member removed successfully", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Legacy function - kept for backward compatibility
 * Get user projects by userId
 */
export async function getUserProjects(userId) {
  const projects = await Project.find({ members: userId })
    .populate("owner", "name email")
    .populate("members", "name email")
    .sort({ updatedAt: -1 });
  
  return projects;
}

