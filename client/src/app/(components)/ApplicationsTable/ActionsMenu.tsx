"use client";
import React, { useState, useRef, useEffect } from "react";
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
  SwapHoriz as SwapHorizIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useAppSelector } from "@/app/redux";

interface ActionsMenuProps {
  applicationId: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: () => void;
  onChangeAssignedTo: () => void;
  onChangeAssignedAgent: () => void;
  onChangeRegistered: () => void;
}

export const ActionsMenu: React.FC<ActionsMenuProps> = ({
  applicationId,
  onView,
  onEdit,
  onDelete,
  onChangeStatus,
  onChangeAssignedTo,
  onChangeAssignedAgent,
  onChangeRegistered,
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

  const handleChangeStatus = () => {
    handleClose();
    onChangeStatus();
  };

  const handleChangeAssignedTo = () => {
    handleClose();
    onChangeAssignedTo();
  };

  const handleChangeAssignedAgent = () => {
    handleClose();
    onChangeAssignedAgent();
  };

  const handleChangeRegistered = () => {
    handleClose();
    onChangeRegistered();
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
        <MenuItem onClick={handleChangeStatus}>
          <ListItemIcon>
            <SwapHorizIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Status</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleChangeAssignedTo}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Handled By</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleChangeAssignedAgent}>
          <ListItemIcon>
            <BusinessIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Agent</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleChangeRegistered}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Registered</ListItemText>
        </MenuItem>
        {currentUser?.role === "admin" && (
          <MenuItem onClick={handleDelete} className="text-red-600">
            <ListItemIcon>
              <DeleteIcon fontSize="small" className="text-red-600" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
