const config = window.FINANCE_FIREBASE_CONFIG;

if (!config || !config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
  window.financeAuth = {
    configured: false,
    user: null,
    profile: null,
    finance: null
  };
  window.dispatchEvent(new CustomEvent("finance-auth-change", {
    detail: {
      configured: false,
      user: null,
      profile: null,
      finance: null,
      verified: false
    }
  }));
} else {
  const [
    { initializeApp },
    {
      getAuth,
      setPersistence,
      browserLocalPersistence,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      sendEmailVerification,
      signOut,
      onAuthStateChanged,
      updateProfile,
      reload
    },
    {
      getFirestore,
      doc,
      getDoc,
      setDoc,
      serverTimestamp
    }
  ] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
  ]);

  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await setPersistence(auth, browserLocalPersistence);

  async function loadProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  }

  async function saveProfile(uid, profile) {
    await setDoc(doc(db, "users", uid), {
      ...profile,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  async function loadFinance(uid) {
    const snap = await getDoc(doc(db, "users", uid, "finance", "default"));
    return snap.exists() ? snap.data() : null;
  }

  async function saveFinance(uid, payload) {
    await setDoc(doc(db, "users", uid, "finance", "default"), {
      entries: Array.isArray(payload.entries) ? payload.entries : [],
      reports: payload.reports && typeof payload.reports === "object" ? payload.reports : {},
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  function publicUser(user) {
    if (!user) return null;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      emailVerified: user.emailVerified
    };
  }

  async function emitAuthState(user) {
    if (!user) {
      window.dispatchEvent(new CustomEvent("finance-auth-change", {
        detail: { configured: true, user: null, profile: null, finance: null, verified: false }
      }));
      return;
    }

    await reload(user);
    const freshUser = auth.currentUser || user;
    const profile = await loadProfile(freshUser.uid);
    const finance = freshUser.emailVerified ? await loadFinance(freshUser.uid) : null;
    window.dispatchEvent(new CustomEvent("finance-auth-change", {
      detail: {
        configured: true,
        user: publicUser(freshUser),
        profile,
        finance,
        verified: freshUser.emailVerified
      }
    }));
  }

  window.financeAuth = {
    configured: true,
    get user() {
      return publicUser(auth.currentUser);
    },
    async register(profile) {
      const credential = await createUserWithEmailAndPassword(auth, profile.email, profile.password);
      const user = credential.user;
      const displayName = `${profile.name} ${profile.surname}`.trim();
      await updateProfile(user, { displayName });
      await saveProfile(user.uid, {
        name: profile.name,
        surname: profile.surname,
        age: Number(profile.age),
        country: profile.country,
        email: profile.email,
        displayName,
        createdAt: serverTimestamp()
      });
      await sendEmailVerification(user);
      await emitAuthState(user);
    },
    async login(email, password) {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await emitAuthState(credential.user);
      if (!credential.user.emailVerified) {
        throw new Error("Please activate your email before using the app.");
      }
    },
    async logout() {
      await signOut(auth);
    },
    async resendVerification() {
      if (!auth.currentUser) throw new Error("Please login first.");
      await sendEmailVerification(auth.currentUser);
    },
    async refreshVerification() {
      if (!auth.currentUser) throw new Error("Please login first.");
      await emitAuthState(auth.currentUser);
    },
    async saveFinance(payload) {
      if (!auth.currentUser || !auth.currentUser.emailVerified) return;
      await saveFinance(auth.currentUser.uid, payload);
    }
  };

  onAuthStateChanged(auth, (user) => {
    emitAuthState(user).catch((error) => {
      window.dispatchEvent(new CustomEvent("finance-auth-error", {
        detail: { message: error.message || "Authentication failed." }
      }));
    });
  });
}

