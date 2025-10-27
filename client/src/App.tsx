import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Courses from "./pages/Courses";
import SignIn from "./pages/SignIn";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import HowToUse from "./pages/HowToUse";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <ProtectedRoute>
                <StudentDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
