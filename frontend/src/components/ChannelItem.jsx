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

  return (
    <div
      role="listitem"
      className={`channel-item ${currentChannelId === channel.id ? 'active' : ''}`}
      onClick={() => setIsOpen(false)} // Закрываем при клике вне
    >
      <button
        type="button"
        className="channel-button"
        onClick={() => onChannelClick(channel.id)}
        aria-current={currentChannelId === channel.id ? 'true' : 'false'}
      >
        <span className="channel-name">#{channel.name}</span>
      </button>

      {channel.removable && (
        <div className="channel-dropdown">
          <button
            type="button"
            className="dropdown-toggle"
            onClick={toggleDropdown}
            aria-label={t('dropdown.manageChannel')}
          >
            {/* Скрытый текст для теста Playwright */}
            <span style={{ position: 'absolute', left: '-9999px' }}>
              {t('dropdown.manageChannel')}
            </span>
            ⋮
          </button>

          {isOpen && (
            <div className="dropdown-menu">
              <button type="button" onClick={handleRename}>
                {t('dropdown.rename')}
              </button>
              <button type="button" onClick={handleRemove}>
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