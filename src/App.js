import React, { useState, useEffect } from "react";

// --- 0. Header Component ---

const Header = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <header style={styles.globalHeader}>
      {!imageError ? (
        <img
          src="/logo.png"
          alt="Logo"
          style={styles.logo}
          onError={() => setImageError(true)}
        />
      ) : (
        <div style={styles.logoPlaceholder}>LOGO</div>
      )}
    </header>
  );
};

// --- 1. Utility Functions ---

const encodeData = (data) => {
  try {
    const json = JSON.stringify(data);
    const base64 = window.btoa(unescape(encodeURIComponent(json)));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (e) {
    console.error("Encode Error:", e);
    return "";
  }
};

const decodeData = (encoded) => {
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const json = decodeURIComponent(escape(window.atob(base64)));
    return JSON.parse(json);
  } catch (e) {
    console.error("Decode Error:", e);
    return null;
  }
};

const shuffleArray = (array) => {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

// --- 2. Game Logic ---

const generateQuizData = (items) => {
  if (items.length < 4) return [];
  const shuffledItems = shuffleArray(items);
  return shuffledItems.map((currentItem) => {
    const correctAnswer = currentItem.back;
    const otherItems = items.filter((item) => item.id !== currentItem.id);
    const wrongItems = shuffleArray(otherItems).slice(0, 3);
    const wrongAnswers = wrongItems.map((item) => item.back);
    const allChoices = shuffleArray([correctAnswer, ...wrongAnswers]);
    return {
      questionId: currentItem.id,
      questionText: currentItem.front,
      correctAnswer: correctAnswer,
      choices: allChoices,
    };
  });
};

// --- 3. Game Components ---

const QuizGame = ({ items, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [currentInfo, setCurrentInfo] = useState(null);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState("loading");
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const quiz = generateQuizData(items);
    setQuestions(quiz);
    setCurrentInfo(quiz[0]);
    setGameState("playing");
    setScore(0);
  }, [items]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState("gameover");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [gameState]);

  const handleAnswerClick = (choice) => {
    if (gameState !== "playing" || feedback) return;

    if (choice === currentInfo.correctAnswer) {
      setScore((prev) => prev + 1);
      setFeedback("correct");
      setTimeout(() => goNext(), 1000);
    } else {
      setFeedback("wrong");
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives === 0) setTimeout(() => setGameState("gameover"), 1000);
        else
          setTimeout(() => {
            setFeedback(null);
            goNext();
          }, 1000);
        return newLives;
      });
    }
  };

  const goNext = () => {
    setFeedback(null);
    const nextStep = questions.indexOf(currentInfo) + 1;
    if (nextStep < questions.length) {
      setCurrentInfo(questions[nextStep]);
      setTimeLeft(30);
    } else {
      setGameState("finished");
    }
  };

  if (gameState === "gameover" || gameState === "finished") {
    return (
      <div style={styles.contentContainer}>
        <h1 style={{ color: gameState === "finished" ? "green" : "red" }}>
          {gameState === "finished" ? "Молодец! 🎉" : "Игра окончена..."}
        </h1>

        <div style={styles.resultBox}>
          <h3>Результат (スコア):</h3>
          <div
            style={{ fontSize: "3rem", fontWeight: "bold", color: "#007bff" }}
          >
            {score}{" "}
            <span style={{ fontSize: "1.5rem", color: "#666" }}>
              / {questions.length}
            </span>
          </div>
          <p>
            {score === questions.length
              ? "Отлично! (全問正解！)"
              : "Хорошая попытка! (惜しい！)"}
          </p>
        </div>

        <button onClick={onBack} style={styles.button}>
          Вернуться в меню
        </button>
      </div>
    );
  }

  if (gameState === "playing" && currentInfo) {
    return (
      <div style={styles.contentContainer}>
        <div style={styles.header}>
          <button onClick={onBack} style={styles.smallBtn}>
            Выход
          </button>
          <div>
            <span style={{ marginRight: "10px" }}>Score: {score}</span>
            {"❤️".repeat(lives)} ⏰ {timeLeft}
          </div>
        </div>
        <div style={styles.questionBox}>
          <h2>{currentInfo.questionText}</h2>
        </div>
        <div style={styles.grid}>
          {currentInfo.choices.map((choice, index) => (
            <button
              key={index}
              style={styles.choiceButton}
              onClick={() => handleAnswerClick(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
        {feedback === "correct" && <div style={styles.overlay}>⭕ Верно!</div>}
        {feedback === "wrong" && <div style={styles.overlay}>❌ Ошибка</div>}
      </div>
    );
  }
  return <div style={styles.contentContainer}>Загрузка...</div>;
};

const Flashcards = ({ items, onBack }) => {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const currentItem = items[index];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setIndex((prev) => (prev - 1 + items.length) % items.length);
    }, 200);
  };

  return (
    <div style={styles.contentContainer}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.smallBtn}>
          Выход
        </button>
        <div>
          Карточка {index + 1} / {items.length}
        </div>
      </div>
      <div style={styles.scene}>
        <div
          style={{
            ...styles.card,
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div style={styles.cardFace}>
            <h2>{currentItem.front}</h2>
            <p style={{ fontSize: "0.8rem", color: "#666" }}>
              (Нажмите, чтобы увидеть ответ)
            </p>
          </div>
          <div style={{ ...styles.cardFace, ...styles.cardBack }}>
            <h2>{currentItem.back}</h2>
          </div>
        </div>
      </div>
      <div style={styles.controls}>
        <button onClick={handlePrev} style={styles.navButton}>
          ◀ Назад
        </button>
        <button onClick={handleNext} style={styles.navButton}>
          Вперёд ▶
        </button>
      </div>
    </div>
  );
};

// --- 4. File System (Folders) ---

const updateTree = (nodes, targetId, callback) => {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return callback(node);
    }
    if (node.children) {
      return {
        ...node,
        children: updateTree(node.children, targetId, callback),
      };
    }
    return node;
  });
};

const deleteFromTree = (nodes, targetId) => {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => {
      if (node.children) {
        return { ...node, children: deleteFromTree(node.children, targetId) };
      }
      return node;
    });
};

const findFolderById = (nodes, id) => {
  for (let node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findFolderById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const findPath = (nodes, targetId, currentPath = []) => {
  for (let node of nodes) {
    if (node.id === targetId) return [...currentPath, node];
    if (node.children) {
      const result = findPath(node.children, targetId, [...currentPath, node]);
      if (result) return result;
    }
  }
  return null;
};

const FileExplorer = ({
  rootStructure,
  currentFolderId,
  onNavigate,
  onUpdateTree,
  onSelectGame,
  isReadOnly,
}) => {
  const currentFolder =
    currentFolderId === null
      ? { id: null, name: "Home", children: rootStructure, items: [] }
      : findFolderById(rootStructure, currentFolderId);

  const breadcrumbs =
    currentFolderId === null
      ? []
      : findPath(rootStructure, currentFolderId) || [];

  const [newFolderName, setNewFolderName] = useState("");
  const [inputFront, setInputFront] = useState("");
  const [inputBack, setInputBack] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  if (!currentFolder)
    return <div style={styles.contentContainer}>Error: Folder not found</div>;

  const handleAddFolder = () => {
    if (!newFolderName) return;
    const newFolder = {
      id: Date.now(),
      name: newFolderName,
      children: [],
      items: [],
    };

    if (currentFolderId === null) {
      onUpdateTree([...rootStructure, newFolder]);
    } else {
      onUpdateTree(
        updateTree(rootStructure, currentFolderId, (node) => ({
          ...node,
          children: [...node.children, newFolder],
        }))
      );
    }
    setNewFolderName("");
  };

  const handleAddItem = () => {
    if (!inputFront || !inputBack || currentFolderId === null) return;
    const newItem = { id: Date.now(), front: inputFront, back: inputBack };

    onUpdateTree(
      updateTree(rootStructure, currentFolderId, (node) => ({
        ...node,
        items: [...node.items, newItem],
      }))
    );
    setInputFront("");
    setInputBack("");
  };

  const handleDelete = (id, type) => {
    if (!window.confirm("Удалить? (削除しますか？)")) return;

    if (type === "folder") {
      onUpdateTree(deleteFromTree(rootStructure, id));
    } else {
      onUpdateTree(
        updateTree(rootStructure, currentFolderId, (node) => ({
          ...node,
          items: node.items.filter((i) => i.id !== id),
        }))
      );
    }
  };

  const handleRename = (id, newName) => {
    onUpdateTree(
      updateTree(rootStructure, id, (node) => ({ ...node, name: newName }))
    );
    setEditingId(null);
  };

  const handleShare = () => {
    const shareData = currentFolder;
    const encoded = encodeData(shareData);
    const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?data=${encoded}`;

    navigator.clipboard.writeText(url).then(() => {
      setShareMessage("Ссылка скопирована! (リンクをコピーしました)");
      setTimeout(() => setShareMessage(""), 3000);
    });
  };

  const subFolders = currentFolder.children || [];
  const items = currentFolder.items || [];

  return (
    <div style={styles.contentContainer}>
      <div style={styles.breadcrumb}>
        <span style={styles.crumb} onClick={() => onNavigate(null)}>
          🏠 Home
        </span>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.id}>
            {" > "}
            <span style={styles.crumb} onClick={() => onNavigate(crumb.id)}>
              {crumb.name}
            </span>
          </span>
        ))}
      </div>

      <h2 style={{ margin: "10px 0" }}>
        📂 {currentFolder.name === "Home" ? "Мои папки" : currentFolder.name}
      </h2>

      {!isReadOnly && (
        <div style={styles.createBox}>
          <input
            style={styles.input}
            placeholder="Новая папка (新規フォルダ名)"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <button style={styles.addButton} onClick={handleAddFolder}>
            ＋ Папка
          </button>
        </div>
      )}

      <div style={styles.gridList}>
        {subFolders.map((folder) => (
          <div key={folder.id} style={styles.folderCard}>
            {editingId === folder.id ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: "100%" }}
                />
                <button
                  style={styles.smallBtn}
                  onClick={() => handleRename(folder.id, editName)}
                >
                  OK
                </button>
              </div>
            ) : (
              <div
                onClick={() => onNavigate(folder.id)}
                style={{ cursor: "pointer", flex: 1 }}
              >
                <div style={{ fontSize: "2rem" }}>📁</div>
                <div style={{ fontWeight: "bold" }}>{folder.name}</div>
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  {folder.items.length} items
                </div>
              </div>
            )}

            {!isReadOnly && editingId !== folder.id && (
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  gap: "5px",
                  justifyContent: "center",
                }}
              >
                <button
                  style={styles.editBtn}
                  onClick={() => {
                    setEditingId(folder.id);
                    setEditName(folder.name);
                  }}
                >
                  ✏️
                </button>
                <button
                  style={styles.delBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(folder.id, "folder");
                  }}
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <hr
        style={{
          margin: "30px 0",
          border: "none",
          borderTop: "1px solid #ccc",
        }}
      />

      {currentFolderId !== null && (
        <>
          <h3>📝 Слова (単語リスト) - {items.length}</h3>

          {!isReadOnly && (
            <div style={styles.formBox}>
              <input
                style={styles.input}
                placeholder="Вопрос (こんにちは)"
                value={inputFront}
                onChange={(e) => setInputFront(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Ответ (Здравствуйте)"
                value={inputBack}
                onChange={(e) => setInputBack(e.target.value)}
              />
              <button style={styles.addButton} onClick={handleAddItem}>
                ＋ Добавить
              </button>
            </div>
          )}

          <div style={styles.listBox}>
            {items.map((item, idx) => (
              <div key={item.id} style={styles.listItem}>
                <span style={{ marginRight: "10px", color: "#999" }}>
                  {idx + 1}.
                </span>
                <span>
                  <b>{item.front}</b> ⇔ {item.back}
                </span>
                {!isReadOnly && (
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDelete(item.id, "item")}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <p style={{ color: "#999", textAlign: "center" }}>
                Список пуст (リストは空です)
              </p>
            )}
          </div>

          <div style={{ marginTop: "20px" }}>
            {!isReadOnly && items.length > 0 && (
              <>
                <button style={styles.shareButton} onClick={handleShare}>
                  🔗 Поделиться (フォルダを共有)
                </button>
                {shareMessage && (
                  <p style={{ color: "green", marginTop: "5px" }}>
                    {shareMessage}
                  </p>
                )}
              </>
            )}

            <div
              style={{
                marginTop: "30px",
                borderTop: "1px solid #ddd",
                paddingTop: "20px",
              }}
            >
              <h3>Проверка игры (プレビュー)</h3>
              <GameSelector items={items} onSelectGame={onSelectGame} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// --- 5. Student Menu ---
const StudentMenu = ({ data, onSelectGame }) => {
  const folderName = data.name || "Учебные материалы";
  const items = data.items || [];

  return (
    <div style={styles.contentContainer}>
      <h1 style={{ color: "#6610f2" }}>🎓 {folderName}</h1>

      {!items || items.length === 0 ? (
        <div
          style={{
            color: "red",
            margin: "20px 0",
            border: "2px solid red",
            padding: "10px",
            borderRadius: "10px",
            backgroundColor: "#fff0f0",
          }}
        >
          <h3>⚠️ Нет данных (データなし)</h3>
          <p>В этой папке нет слов для изучения.</p>
        </div>
      ) : (
        <>
          <p style={{ marginBottom: "30px" }}>
            Количество слов: <b>{items.length}</b>
          </p>
          <GameSelector items={items} onSelectGame={onSelectGame} />
        </>
      )}
    </div>
  );
};

const GameSelector = ({ items, onSelectGame }) => {
  const safeItems = items || [];
  return (
    <div style={styles.gameSelector}>
      <button
        style={safeItems.length >= 4 ? styles.gameBtn : styles.disabledBtn}
        onClick={() => onSelectGame("quiz")}
        disabled={safeItems.length < 4}
      >
        🕹️ Викторина
        <br />
        <span style={{ fontSize: "0.7rem" }}>(нужно 4+)</span>
      </button>
      <button
        style={safeItems.length >= 1 ? styles.gameBtn : styles.disabledBtn}
        onClick={() => onSelectGame("cards")}
        disabled={safeItems.length < 1}
      >
        🃏 Карточки
        <br />
        <span style={{ fontSize: "0.7rem" }}>(Обучение)</span>
      </button>
    </div>
  );
};

// --- 6. Main App ---

export default function App() {
  const [studentData, setStudentData] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get("data");
    if (dataParam) {
      return decodeData(dataParam);
    }
    return null;
  });

  const isStudent = !!studentData;

  const [fileSystem, setFileSystem] = useState([
    {
      id: 1,
      name: "Урок 1 (Lesson 1)",
      children: [],
      items: [
        { id: 1, front: "こんにちは", back: "Здравствуйте" },
        { id: 2, front: "ありがとう", back: "Спасибо" },
        { id: 3, front: "さようなら", back: "До свидания" },
        { id: 4, front: "猫 (ねこ)", back: "Кошка" },
        { id: 5, front: "犬 (いぬ)", back: "Собака" },
        { id: 6, front: "美味しい", back: "Вкусно" },
        { id: 7, front: "水 (みず)", back: "Вода" },
        { id: 8, front: "本 (ほん)", back: "Книга" },
        { id: 9, front: "学生 (がくせい)", back: "Студент" },
        { id: 10, front: "先生 (せんせい)", back: "Учитель" },
        { id: 11, front: "友達 (ともだち)", back: "Друг" },
        { id: 12, front: "家族 (かぞく)", back: "Семья" },
        { id: 13, front: "家 (いえ)", back: "Дом" },
        { id: 14, front: "車 (くるま)", back: "Машина" },
        { id: 15, front: "りんご", back: "Яблоко" },
        { id: 16, front: "パン", back: "Хлеб" },
        { id: 17, front: "牛乳 (ぎゅうにゅう)", back: "Молоко" },
        { id: 18, front: "コーヒー", back: "Кофе" },
        { id: 19, front: "お茶 (おちゃ)", back: "Чай" },
        { id: 20, front: "おはよう", back: "Доброе утро" },
        { id: 21, front: "こんばんは", back: "Добрый вечер" },
        { id: 22, front: "おやすみ", back: "Спокойной ночи" },
        { id: 23, front: "名前 (なまえ)", back: "Имя" },
        { id: 24, front: "私 (わたし)", back: "Я" },
        { id: 25, front: "日本 (にほん)", back: "Япония" },
        { id: 26, front: "ロシア", back: "Россия" },
        { id: 27, front: "愛 (あい)", back: "Любовь" },
        { id: 28, front: "平和 (へいわ)", back: "Мир" },
        { id: 29, front: "音楽 (おんがく)", back: "Музыка" },
        { id: 30, front: "時間 (じかん)", back: "Время" },
      ],
    },
    {
      id: 2,
      name: "Пример папки (Folder Example)",
      items: [],
      children: [
        { id: 21, name: "Subfolder A", items: [], children: [] },
        { id: 22, name: "Subfolder B", items: [], children: [] },
      ],
    },
  ]);

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentMode, setCurrentMode] = useState("menu");

  const renderContent = () => {
    if (isStudent) {
      if (currentMode === "menu") {
        return <StudentMenu data={studentData} onSelectGame={setCurrentMode} />;
      }
      const items = studentData.items || [];
      if (currentMode === "quiz")
        return <QuizGame items={items} onBack={() => setCurrentMode("menu")} />;
      if (currentMode === "cards")
        return (
          <Flashcards items={items} onBack={() => setCurrentMode("menu")} />
        );
    }

    if (currentMode !== "menu") {
      const currentFolder = findFolderById(fileSystem, currentFolderId);
      const items = currentFolder ? currentFolder.items : [];
      if (currentMode === "quiz")
        return <QuizGame items={items} onBack={() => setCurrentMode("menu")} />;
      if (currentMode === "cards")
        return (
          <Flashcards items={items} onBack={() => setCurrentMode("menu")} />
        );
    }

    return (
      <FileExplorer
        rootStructure={fileSystem}
        currentFolderId={currentFolderId}
        onNavigate={setCurrentFolderId}
        onUpdateTree={setFileSystem}
        onSelectGame={setCurrentMode}
        isReadOnly={false}
      />
    );
  };

  return (
    <div style={styles.appWrapper}>
      <Header />
      <main style={styles.mainContent}>{renderContent()}</main>
    </div>
  );
}

// --- 7. Styles ---
const styles = {
  appWrapper: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },
  // Header styles updated: Background color #07095b
  globalHeader: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#07095b", // 【変更】濃紺
    padding: "15px 30px",
    color: "#ffffff",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    zIndex: 100,
  },
  logo: {
    width: "300px",
    height: "auto",
    display: "block",
    minHeight: "50px",
  },
  logoPlaceholder: {
    width: "300px",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "1.2rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "2px dashed #555",
    padding: "10px",
    borderRadius: "8px",
  },

  mainContent: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    padding: "20px",
    backgroundColor: "#f9f9f9",
  },
  contentContainer: {
    maxWidth: "800px",
    width: "100%",
    margin: "0 auto",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  breadcrumb: {
    textAlign: "left",
    padding: "10px",
    background: "#f8f9fa",
    borderRadius: "5px",
    marginBottom: "10px",
    fontSize: "0.9rem",
    color: "#666",
  },
  crumb: { cursor: "pointer", color: "#007bff", textDecoration: "underline" },
  gridList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
  },
  folderCard: {
    padding: "15px",
    border: "1px solid #eee",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "transform 0.2s",
    ":hover": { transform: "translateY(-2px)" },
  },
  createBox: { display: "flex", gap: "5px", marginBottom: "20px" },
  formBox: {
    backgroundColor: "#f0f2f5",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "12px",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    flex: 1,
    outline: "none",
    transition: "border-color 0.3s",
  },
  listBox: {
    textAlign: "left",
    border: "1px solid #eee",
    borderRadius: "12px",
    padding: "10px",
    maxHeight: "400px",
    overflowY: "auto",
    background: "#fff",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    borderBottom: "1px solid #f0f0f0",
  },
  addButton: {
    padding: "12px 20px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  deleteButton: {
    padding: "4px 10px",
    backgroundColor: "#ff4d4f",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginLeft: "10px",
    fontSize: "1.1rem",
  },
  editBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.2rem",
    padding: "5px",
  },
  delBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.2rem",
    padding: "5px",
    color: "#ff4d4f",
  },
  smallBtn: {
    padding: "6px 12px",
    cursor: "pointer",
    background: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
  },
  shareButton: {
    padding: "12px 24px",
    backgroundColor: "#6610f2",
    color: "white",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
    fontSize: "1.1rem",
    boxShadow: "0 4px 10px rgba(102, 16, 242, 0.3)",
    transition: "transform 0.2s",
  },
  gameSelector: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "20px",
  },
  gameBtn: {
    padding: "15px 30px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1.1rem",
    flex: 1,
    maxWidth: "200px",
    boxShadow: "0 4px 10px rgba(0, 123, 255, 0.3)",
    transition: "transform 0.2s",
  },
  disabledBtn: {
    padding: "15px 30px",
    backgroundColor: "#e9ecef",
    color: "#adb5bd",
    border: "none",
    borderRadius: "12px",
    cursor: "not-allowed",
    fontSize: "1.1rem",
    flex: 1,
    maxWidth: "200px",
  },
  questionBox: {
    padding: "40px",
    backgroundColor: "#e7f1ff",
    borderRadius: "16px",
    marginBottom: "30px",
    fontSize: "2rem",
    color: "#0056b3",
    fontWeight: "bold",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    flex: 1,
  },
  choiceButton: {
    padding: "25px",
    fontSize: "1.3rem",
    cursor: "pointer",
    backgroundColor: "#fff",
    color: "#007bff",
    border: "2px solid #007bff",
    borderRadius: "12px",
    transition: "all 0.2s",
    fontWeight: "bold",
    ":hover": { backgroundColor: "#007bff", color: "#fff" },
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "5rem",
    fontWeight: "bold",
    color: "#28a745",
    zIndex: 10,
  },
  scene: {
    width: "100%",
    height: "350px",
    perspective: "1000px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "30px 0",
  },
  card: {
    width: "90%",
    maxWidth: "500px",
    height: "100%",
    position: "relative",
    transformStyle: "preserve-3d",
    transition: "transform 0.6s",
    cursor: "pointer",
  },
  cardFace: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    border: "none",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#333",
  },
  cardBack: {
    backgroundColor: "#f8f9fa",
    transform: "rotateY(180deg)",
    color: "#007bff",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginTop: "30px",
  },
  navButton: {
    padding: "12px 24px",
    fontSize: "1.1rem",
    cursor: "pointer",
    backgroundColor: "#fff",
    border: "2px solid #007bff",
    color: "#007bff",
    borderRadius: "50px",
    transition: "all 0.2s",
    ":hover": { backgroundColor: "#007bff", color: "#fff" },
  },
  resultBox: {
    marginTop: "30px",
    padding: "30px",
    border: "none",
    borderRadius: "16px",
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  button: {
    padding: "12px 30px",
    fontSize: "1.1rem",
    marginTop: "20px",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "50px",
    boxShadow: "0 4px 10px rgba(0, 123, 255, 0.3)",
  },
};
