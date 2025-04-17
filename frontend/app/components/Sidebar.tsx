import { Link, useLocation } from 'react-router';
import { useState } from 'react';
import '../styles/sidebar.css';

interface SidebarProps {
  pages: {
    name: string;
    path: string;
    icon: string;
    children?: { name: string; path: string }[];
  }[];
  collapsed?: boolean;
}

export default function Sidebar({ pages, collapsed = false }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (e: React.MouseEvent, pageName: string) => {
    e.preventDefault(); // Prevent navigation for parent items with children
    setExpandedItems(prev =>
      prev.includes(pageName)
        ? prev.filter(item => item !== pageName)
        : [...prev, pageName]
    );
  };

  const handleLogout = () => {
    // Add logout logic here
    window.location.href = '/login';
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav>
        {pages.map((page) => (
          <div key={page.path} className="nav-item">
            {page.children ? (
              // Parent item with children - acts as dropdown toggle
              <a
                href="#"
                className={`nav-link d-flex align-items-center justify-content-between ${
                  location.pathname.includes(page.path) ? 'active' : ''
                }`}
                onClick={(e) => toggleExpand(e, page.name)}
              >
                <div className="d-flex align-items-center">
                  <i className={`fas fa-${page.icon} me-2`} />
                  {!collapsed && <span>{page.name}</span>}
                </div>
                {!collapsed && (
                  <i className={`fas fa-chevron-${expandedItems.includes(page.name) ? 'down' : 'right'} ms-2`} />
                )}
              </a>
            ) : (
              // Regular menu item - acts as navigation link
              <Link
                to={page.path}
                className={`nav-link d-flex align-items-center ${
                  location.pathname === page.path ? 'active' : ''
                }`}
              >
                <i className={`fas fa-${page.icon} me-2`} />
                {!collapsed && <span>{page.name}</span>}
              </Link>
            )}

            {/* Dropdown menu for children */}
            {!collapsed && page.children && expandedItems.includes(page.name) && (
              <div className="child-nav">
                {page.children.map((child) => (
                  <Link
                    key={child.path}
                    to={child.path}
                    className={`nav-link ${
                      location.pathname === child.path ? 'active' : ''
                    }`}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="nav-link logout-btn"
        >
          <i className="fas fa-sign-out-alt me-2" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
