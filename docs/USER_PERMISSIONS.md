# User Permissions & Role Management Guide

## Overview

The Buhariwala Warehouse PWA implements a hierarchical role-based access control system with three distinct user roles. This document outlines the permissions and capabilities for each role within the Users Management system.

---

## 🔐 User Roles

### 1. Super Admin
**Highest level of access with full system control**

- **Badge Color**: Red
- **Icon**: Shield
- **Access Level**: Complete administrative control

### 2. Checker
**Supervisory role with limited administrative capabilities**

- **Badge Color**: Blue
- **Icon**: Shield
- **Access Level**: Can manage Maker users only

### 3. Maker
**Standard user role with basic operational access**

- **Badge Color**: Gray
- **Icon**: Shield
- **Access Level**: No user management capabilities

---

## 📊 Users Page Access Matrix

| Feature | Super Admin | Checker | Maker |
|---------|-------------|---------|--------|
| **Access Users Page** | ✅ Yes | ✅ Yes | ❌ No Access |
| **View All Users** | ✅ All Roles | ❌ Makers Only | ❌ N/A |
| **Create New Users** | ✅ All Roles | ✅ Makers Only | ❌ N/A |
| **Edit User Profiles** | ✅ All Users | ✅ Makers Only | ❌ N/A |
| **Activate/Deactivate** | ✅ All Users | ✅ Makers Only | ❌ N/A |
| **Delete Users** | ✅ Non-Admins | ❌ No | ❌ N/A |
| **Filter by Role** | ✅ All Options | 🔶 Limited | ❌ N/A |

---

## 🎛️ Detailed Permissions

### Super Admin Capabilities

#### **Full User Management**
- View all users (Super Admins, Checkers, Makers)
- Create users with any role (Super Admin, Checker, Maker)
- Edit all user profiles and information
- Activate or deactivate any user account
- Delete Checker and Maker accounts (cannot delete other Super Admins)

#### **Advanced Features**
- Access to all filter options in dropdown:
  - All Users
  - Super Admins
  - Checkers
  - Makers
- Complete visibility into system user hierarchy
- Full administrative control over user lifecycle

#### **Security Restrictions**
- Cannot delete other Super Admin accounts (protection against lockout)
- All actions are logged for audit purposes

---

### Checker Capabilities

#### **Limited User Management**
- View only Maker role users
- Create new Maker accounts only
- Edit existing Maker profiles
- Activate or deactivate Maker accounts
- **Cannot** delete any user accounts

#### **Restricted Visibility**
- Filter options limited to:
  - All Users (shows only Makers)
  - Makers
- Cannot see or interact with Checker or Super Admin accounts
- Hidden from other Checkers for security

#### **Use Cases**
- Supervise warehouse floor operations
- Onboard new warehouse staff
- Manage day-to-day user accounts for operational staff
- Maintain user information for direct reports

---

### Maker Capabilities

#### **No User Management Access**
- Cannot access the Users page
- No visibility into other user accounts
- Cannot create, edit, or delete any users
- Cannot modify user permissions or roles

#### **Operational Focus**
- Limited to core warehouse operations
- Access to job management and inventory functions
- Cannot perform administrative tasks

---

## 🎨 User Interface Elements

### User Cards
Each user is displayed in an individual card containing:

- **User Avatar**: Colored circle with initials
- **Full Name**: Primary identifier
- **Username**: Secondary identifier with @ prefix
- **Email Address**: Contact information
- **Phone Number**: Additional contact (if provided)
- **Role Badge**: Color-coded role indicator
- **Active Status**: Green (Active) or Gray (Inactive) indicator
- **Join Date**: Account creation timestamp
- **Action Buttons**: Role-specific management options

### Action Buttons

#### **Edit User** (Blue Button)
- Available to: Super Admins (all users), Checkers (makers only)
- Function: Modify user profile information
- Icon: Edit pencil

#### **Activate/Deactivate** (Yellow/Green Button)
- Available to: Super Admins (all users), Checkers (makers only)
- Function: Enable or disable user account access
- Icons: Clock (deactivate), CheckCircle (activate)

#### **Delete User** (Red Button)
- Available to: Super Admins only
- Function: Permanently remove user account
- Restriction: Cannot delete Super Admin accounts
- Icon: Trash can
- Safety: Confirmation dialog required

---

## 🔍 Filtering System

### Super Admin Filters
```
All Users          → Shows all users regardless of role
Super Admins       → Shows only Super Admin accounts
Checkers          → Shows only Checker accounts
Makers            → Shows only Maker accounts
```

### Checker Filters
```
All Users          → Shows only Maker accounts (restricted view)
Makers            → Shows only Maker accounts
```

**Note**: Checker and Super Admin filter options are hidden for Checker users to maintain security boundaries.

---

## 🛡️ Security Features

### Access Control
- **Route Protection**: Unauthorized users redirected to dashboard
- **Role Verification**: Server-side role checking for all operations
- **Data Filtering**: Backend filters data based on user role permissions

### Audit Trail
- All user management actions are logged
- User creation, modification, and deletion tracked
- Role changes and permission updates recorded

### Safety Mechanisms
- Super Admin accounts cannot be deleted
- Confirmation dialogs for destructive actions
- Automatic session management and timeout
- Input validation and sanitization

---

## 📱 Responsive Design

The Users page is fully responsive across all device sizes:

- **Desktop**: 4-column card grid layout
- **Tablet**: 2-3 column responsive grid
- **Mobile**: Single column stack layout
- **Touch-Friendly**: Large buttons and touch targets
- **Accessibility**: Screen reader compatible with proper ARIA labels

---

## 🚀 Getting Started

### For Super Admins
1. Navigate to **Users** from the sidebar
2. View the complete user list with role badges
3. Use filters to find specific user types
4. Click **Add New User** to create accounts
5. Use action buttons to manage existing users

### For Checkers
1. Navigate to **Users** from the sidebar (now available)
2. View your assigned Maker users
3. Filter by "All Users" or "Makers"
4. Create new Maker accounts as needed
5. Edit and manage existing Maker profiles

### For Makers
- The Users page is not accessible to Maker role users
- Focus on operational tasks through other dashboard sections

---

## ❓ Frequently Asked Questions

**Q: Why can't Checkers see other Checkers or Super Admins?**
A: This maintains security boundaries and prevents lateral privilege escalation. Each Checker can only manage their assigned operational staff.

**Q: Why can't Super Admins delete other Super Admin accounts?**
A: This prevents accidental lockout scenarios and maintains system administrative access.

**Q: Can roles be changed after user creation?**
A: Yes, but only through the edit functionality. Role changes should be done carefully as they affect user permissions immediately.

**Q: What happens when a user is deactivated?**
A: Deactivated users cannot log in but their account data is preserved. They can be reactivated at any time.

**Q: How are passwords managed?**
A: Passwords are set during user creation and can be reset through the edit functionality. All passwords are securely hashed and stored.

---

## 📞 Support

For technical issues or questions about user management:
- Check the application logs for error details
- Verify user permissions and role assignments
- Contact system administrators for complex permission issues

---

*Last Updated: January 2025*
*Version: 2.0*