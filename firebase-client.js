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
      verifyBeforeUpdateEmail,
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

  async function saveProfileDoc(uid, profile) {
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
      limits: payload.limits && typeof payload.limits === "object" ? payload.limits : {},
      budget: payload.budget && typeof payload.budget === "object" ? payload.budget : {},
      goals: payload.goals && typeof payload.goals === "object" ? payload.goals : {},
      recurringRules: Array.isArray(payload.recurringRules) ? payload.recurringRules : [],
      notices: payload.notices && typeof payload.notices === "object" ? payload.notices : {},
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
    let profile = await loadProfile(freshUser.uid);
    if (profile?.pendingEmail && String(profile.pendingEmail).toLowerCase() === String(freshUser.email || "").toLowerCase()) {
      await saveProfileDoc(freshUser.uid, { email: freshUser.email, pendingEmail: "" });
      profile = { ...profile, email: freshUser.email, pendingEmail: "" };
    }
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
      await saveProfileDoc(user.uid, {
        name: profile.name,
        surname: profile.surname,
        gender: profile.gender,
        birthDate: profile.birthDate,
        country: profile.country,
        residenceCountry: profile.country,
        originCountry: profile.originCountry,
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
      if (!auth.currentUser?.emailVerified) {
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
    async saveProfile(profile) {
      if (!auth.currentUser || !auth.currentUser.emailVerified) return;
      await saveProfileDoc(auth.currentUser.uid, {
        ...profile,
        email: auth.currentUser.email,
        displayName: profile.displayName || auth.currentUser.displayName || ""
      });
    },
    async updateAccountSettings(profile) {
      if (!auth.currentUser || !auth.currentUser.emailVerified) {
        throw new Error("Please login with an activated account first.");
      }
      const user = auth.currentUser;
      const displayName = `${profile.name || ""} ${profile.surname || ""}`.trim();
      if (displayName && displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }

      const requestedEmail = String(profile.email || "").trim();
      const emailChanged = requestedEmail && requestedEmail.toLowerCase() !== String(user.email || "").toLowerCase();
      const profileDoc = {
        name: profile.name || "",
        surname: profile.surname || "",
        gender: profile.gender || "",
        birthDate: profile.birthDate || "",
        country: profile.country || "",
        residenceCountry: profile.country || "",
        originCountry: profile.originCountry || "",
        displayName: displayName || user.displayName || "",
        email: user.email || "",
        pendingEmail: emailChanged ? requestedEmail : ""
      };

      if (emailChanged) {
        await verifyBeforeUpdateEmail(user, requestedEmail);
        await saveProfileDoc(user.uid, profileDoc);
        await emitAuthState(user);
        return { pendingEmail: requestedEmail };
      }

      await saveProfileDoc(user.uid, profileDoc);
      await emitAuthState(user);
      return { pendingEmail: "" };
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
