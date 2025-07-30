
import { Route, Routes } from 'react-router-dom';
import './App.scss';
import { HomePage } from '../../pages/HomePage/HomePage';
import { GamePage } from '../../pages/GamePage/GamePage';
import { SettingsPage } from '../../pages/SettingsPage/SettingsPage';
import { Header } from '../Header/Header';
import { TopsPage } from '../../pages/TopsPage/TopsPage';

export const App = () => {
  return (
    <>
      <div className='app'>
        <div className="app-overlay"></div>
        <Header />

        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/game' element={<GamePage />} />
          <Route path='/settings' element={<SettingsPage />} />
          <Route path='/tops' element={<TopsPage />} />
        </Routes>
      </div>
    </>
  )
}

