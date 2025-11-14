import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem
} from 'reactstrap';

const Navigation = () => {
  return (
    <Navbar color="dark" dark expand="md">
      <NavbarBrand tag={NavLink} to="/">🛡️ Phishing Simulation</NavbarBrand>
      <Nav className="ms-auto" navbar>
        <NavItem>
          <NavLink className="nav-link" to="/" end>
            Dashboard
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className="nav-link" to="/recipients">
            Recipients
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className="nav-link" to="/campaigns">
            Campaigns
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className="nav-link" to="/analytics">
            Analytics
          </NavLink>
        </NavItem>
      </Nav>
    </Navbar>
  );
};

export default Navigation;

