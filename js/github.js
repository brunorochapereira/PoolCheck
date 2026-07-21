const GitHubSync = (() => {
  function cfg() { return PoolStore.get().github; }
  function headers() {
    const c = cfg();
    return {
      "Accept":"application/vnd.github+json",
      "Authorization":`Bearer ${c.token}`,
      "X-GitHub-Api-Version":"2022-11-28",
      "Content-Type":"application/json"
    };
  }
  function baseUrl(path="") {
    const c=cfg();
    return `https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${path}`;
  }
  async function test() {
    const c=cfg();
    if(!c.owner||!c.repo||!c.token) throw new Error("Preenche proprietário, repositório e token.");
    const res=await fetch(`https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}`,{headers:headers()});
    if(!res.ok) throw new Error(`GitHub respondeu ${res.status}. Confirma o token e as permissões.`);
    return await res.json();
  }
  async function getFile(path) {
    const c=cfg();
    const res=await fetch(`${baseUrl(path)}?ref=${encodeURIComponent(c.branch||"main")}`,{headers:headers()});
    if(res.status===404) return null;
    if(!res.ok) throw new Error(`Erro ao ler ${path}: ${res.status}`);
    return await res.json();
  }
  function utf8ToBase64(str){ return btoa(unescape(encodeURIComponent(str))); }
  function base64ToUtf8(str){ return decodeURIComponent(escape(atob(str.replace(/\n/g,"")))); }
  async function putFile(path, content, message) {
    const current=await getFile(path);
    const c=cfg();
    const body={message,content:utf8ToBase64(content),branch:c.branch||"main"};
    if(current?.sha) body.sha=current.sha;
    const res=await fetch(baseUrl(path),{method:"PUT",headers:headers(),body:JSON.stringify(body)});
    if(!res.ok) throw new Error(`Erro ao gravar ${path}: ${res.status}`);
    return await res.json();
  }
  async function pushAll() {
    const state=structuredClone(PoolStore.get());
    state.github.token="";
    await putFile("data/poolcheck-data.json",JSON.stringify(state,null,2),`PoolCheck sync ${new Date().toISOString()}`);
    PoolStore.update(s=>s.lastSync=new Date().toISOString());
  }
  async function pullAll() {
    const file=await getFile("data/poolcheck-data.json");
    if(!file) throw new Error("Ainda não existe um ficheiro de dados no repositório.");
    const remote=JSON.parse(base64ToUtf8(file.content));
    const localToken=PoolStore.get().github.token;
    const localGithub=PoolStore.get().github;
    remote.github={...localGithub,...remote.github,token:localToken};
    PoolStore.replace(remote);
  }
  return { test, pushAll, pullAll };
})();