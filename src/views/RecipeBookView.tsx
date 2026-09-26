import React from 'react';

const RecipeBookView: React.FC = () => {
  return (
    <div className="view-container">
      <h2>📖 레시피북</h2>
      <p>만들 수 있는 요리 목록을 확인하고 요리를 시작합니다.</p>
      <div className="placeholder-box">
        레시피 1. 계란 프라이<br/>
        레시피 2. 팬케이크<br/>
        (구현 예정)
      </div>
    </div>
  );
};

export default RecipeBookView;
