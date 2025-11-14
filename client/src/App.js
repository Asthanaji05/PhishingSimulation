import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'reactstrap';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Recipients from './pages/Recipients';
import Campaigns from './pages/Campaigns';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Container fluid className="mt-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recipients" element={<Recipients />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;

