// src/components/ChannelItem.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ChannelItem = ({ channel, currentChannelId, onChannelClick, onRename, onRemove }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleRename = (e) => {
    e.stopPropagation();
    onRename(channel.id);
    setIsOpen(false);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove(channel.id);
    setIsOpen(false);
  };

  const closeDropdown = () => setIsOpen(false);

  return (
    <div
      role="listitem"
      className={`channel-item ${currentChannelId === channel.id ? 'active' : ''}`}
      onClick={closeDropdown} // Закрываем меню при клике на элемент канала
    >
      <button
        type="button"
        className="channel-button flex-grow-1 text-start border-0 bg-transparent"
        onClick={() => onChannelClick(channel.id)}
        aria-current={currentChannelId === channel.id ? 'true' : 'false'}
      >
        <span className="channel-name">#{channel.name}</span>
      </button>

      {channel.removable && (
        <div className="channel-dropdown" style={{ position: 'relative' }}>
          <button
            type="button"
            className="dropdown-toggle border-0 bg-transparent"
            onClick={toggleDropdown}
            aria-label={t('dropdown.manageChannel')}
          >
            {t('dropdown.manageChannel')} {/* Видимый текст для теста */}
            <span aria-hidden="true" style={{ marginLeft: '5px' }}>⋮</span>
          </button>

          {isOpen && (
            <div
              className="dropdown-menu"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '4px',
                zIndex: 1000,
                minWidth: '160px',
                padding: '8px 0',
              }}
              onClick={(e) => e.stopPropagation()} // Не закрываем при клике внутри меню
            >
              <button
                type="button"
                className="dropdown-item text-start w-100 border-0 bg-transparent px-3 py-2"
                onClick={handleRename}
                style={{ cursor: 'pointer' }}
              >
                {t('dropdown.rename')}
              </button>
              <button
                type="button"
                className="dropdown-item text-start w-100 border-0 bg-transparent px-3 py-2 text-danger"
                onClick={handleRemove}
                style={{ cursor: 'pointer' }}
              >
                {t('dropdown.remove')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChannelItem;
