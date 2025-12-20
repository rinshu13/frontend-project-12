import { useState, useEffect, useRef } from 'react';

const ChannelItem = ({ channel, currentChannelId, onChannelClick, onRename, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
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

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      role="listitem"
      className={`channel-item d-flex align-items-center ${currentChannelId === channel.id ? 'active' : ''}`}
      style={{ padding: '8px 12px', cursor: 'pointer' }}
    >
      <button
        type="button"
        className="channel-button flex-grow-1 text-start border-0 bg-transparent text-decoration-none"
        onClick={() => onChannelClick(channel.id)}
        style={{ color: 'inherit' }}
      >
        <span className="channel-name">#{channel.name}</span>
      </button>

      {channel.removable && (
        <div className="channel-dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="dropdown-toggle border-0 bg-transparent p-1"
            onClick={toggleDropdown}
            aria-label="Управление каналом"
            aria-haspopup="true"
            aria-expanded={isOpen}
            style={{ fontSize: '1.2rem', lineHeight: '1' }}
          >
            <span aria-hidden="true">⋮</span>
          </button>

          {isOpen && (
            <div
              className="dropdown-menu show"
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
                marginTop: '4px',
              }}
            >
              <button
                type="button"
                className="dropdown-item text-start w-100 border-0 bg-transparent px-3 py-2"
                onClick={handleRename}
              >
                Переименовать
              </button>
              <button
                type="button"
                className="dropdown-item text-start w-100 border-0 bg-transparent px-3 py-2 text-danger"
                onClick={handleRemove}
              >
                Удалить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChannelItem;