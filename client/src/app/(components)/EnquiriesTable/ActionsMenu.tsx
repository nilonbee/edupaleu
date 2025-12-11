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
  Article as FileTextIcon,
} from "@mui/icons-material";
import { useAppSelector } from "@/app/redux";

interface ActionsMenuProps {
  enquiryId: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateApplication: () => void;
}

export const ActionsMenu: React.FC<ActionsMenuProps> = ({
  enquiryId,
  onView,
  onEdit,
  onDelete,
  onCreateApplication,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const currentUser = useAppSelector((state) => state.auth.user);

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

  const handleCreateApplication = () => {
    handleClose();
    onCreateApplication();
  };

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
        <MenuItem onClick={handleCreateApplication}>
          <ListItemIcon>
            <FileTextIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create Application</ListItemText>
        </MenuItem>
        {currentUser?.role === "admin" && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <FileTextIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
