"use client";
import React, { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { User } from "@/state/userApi";

interface ActionsMenuProps {
  userId: number;
  user: User;
  currentUserId?: number;
  currentUserRole?: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onResendInvite: () => void;
  onToggleActive?: () => void;
}

export const ActionsMenu: React.FC<ActionsMenuProps> = ({
  userId,
  user,
  currentUserId,
  currentUserRole,
  onView,
  onEdit,
  onDelete,
  onResendInvite,
  onToggleActive,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    handleClose();
    onView();
  };

  const handleEdit = () => {
    handleClose();
    onEdit();
  };

  const handleDelete = () => {
    handleClose();
    onDelete();
  };

  const handleResendInvite = () => {
    handleClose();
    onResendInvite();
  };

  const handleToggleActive = () => {
    handleClose();
    if (onToggleActive) {
      onToggleActive();
    }
  };

  // Check if current user can toggle this user's status
  const canToggleStatus = 
    (currentUserRole === 'admin' || currentUserRole === 'agent') &&
    onToggleActive !== undefined;

  return (
    <>
      <IconButton
        size="small"
        onClick={handleClick}
        className="text-gray-600 hover:text-gray-900"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleResendInvite}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Resend Invite</ListItemText>
        </MenuItem>
        {canToggleStatus && (
          <MenuItem onClick={handleToggleActive}>
            <ListItemIcon>
              {user.isActive ? (
                <CancelIcon fontSize="small" />
              ) : (
                <CheckCircleIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>
              {user.isActive ? "Deactivate Account" : "Activate Account"}
            </ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} className="text-red-600">
          <ListItemIcon>
            <DeleteIcon fontSize="small" className="text-red-600" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
