"""Package the verified frontend without replacing historical training handoffs."""
from pathlib import Path
import argparse, datetime, hashlib, json, re, zipfile

ROOT=Path(__file__).resolve().parents[1]
RELEASE=ROOT/'release'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def archive(target,files,prefix):
    if target.exists():
        raise RuntimeError(f'Preserve the existing archive: {target.name}')
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=3) as out:
        for path in sorted(set(files)):
            out.write(path,prefix+path.relative_to(ROOT).as_posix())
    with zipfile.ZipFile(target) as out:
        bad=out.testzip()
        if bad: raise RuntimeError('Corrupt archive member '+bad)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tag',default='20261012',help='Unique release suffix; existing archives are never replaced')
    args=parser.parse_args()
    if not re.fullmatch(r'[a-z0-9-]+',args.tag): parser.error('tag must contain only lowercase letters, digits and hyphens')
    source=[]
    for folder in ('src','scripts','public','tests'):
        for path in (ROOT/folder).rglob('*'):
            if not path.is_file() or '__pycache__' in path.parts: continue
            relative=path.relative_to(ROOT).as_posix()
            if folder=='tests' and not (len(path.relative_to(ROOT).parts)==2 or relative.startswith('tests/fixtures/')):continue
            source.append(path)
    source.extend(ROOT/name for name in ('index.html','studio.html','research.html','vite.config.js','vercel.json','package.json','package-lock.json','AGENTS.md','.gitignore','README.md'))
    source.extend((ROOT/'docs').glob('FRONTEND*.md'))
    source.extend(ROOT/'docs'/name for name in ('STUDIO-REDESIGN.md','GALLERY-STUDIES.json'))
    source.extend(path for path in (RELEASE/'frontend').rglob('*') if path.is_file())
    source.extend(path for path in (RELEASE/'studio-redesign').rglob('*') if path.is_file())
    source_zip=RELEASE/f'The-Painters-Hand-frontend-source-{args.tag}.zip'
    archive(source_zip,source,'The-Painters-Hand/')
    hosted_zip=RELEASE/f'The-Painters-Hand-hosted-{args.tag}.zip'
    archive(hosted_zip,[p for p in (ROOT/'dist').rglob('*') if p.is_file()],'')
    manifest_path=RELEASE/'manifest.json'
    manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    targets=[RELEASE/'The-Painters-Hand.html',source_zip,hosted_zip,ROOT/'docs/FRONTEND-RELEASE.md',ROOT/'docs/STUDIO-REDESIGN.md',ROOT/'docs/GALLERY-STUDIES.json']
    files={row['path']:row for row in manifest['files']}
    for path in targets:
        key=path.relative_to(ROOT).as_posix()
        files[key]={'path':key,'bytes':path.stat().st_size,'sha256':sha(path)}
    manifest['files']=list(files.values())
    manifest['frontend']={'created_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'report':'docs/FRONTEND-RELEASE.md','evidence':'release/frontend/','model_assets_changed':False,'training_restarted':False,'deployment_performed':False,'domain_configured':False,'source_package_scope':'Runtime, bundled models, frontend/build source, browser tests and frontend evidence. Training corpus/experiment evidence remain in the original source handoff and local repository.'}
    manifest['studio_redesign']={'report':'docs/STUDIO-REDESIGN.md','evidence':'release/studio-redesign/','gallery_manifest':'docs/GALLERY-STUDIES.json','gallery_count':6,'model_assets_changed':False,'training_restarted':False}
    manifest_path.write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(json.dumps({'source_zip_bytes':source_zip.stat().st_size,'hosted_zip_bytes':hosted_zip.stat().st_size,'offline_bytes':targets[0].stat().st_size}))

if __name__=='__main__':main()
