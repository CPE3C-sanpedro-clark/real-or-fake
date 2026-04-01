// This is the main App component. It will contain the routes of the websites
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home-page';
import AboutPage from './pages/about-page';
import ApiTester from './assets/components/apitester';

function App() {
  return (
    <BrowserRouter>
      
      <ApiTester /> 
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
