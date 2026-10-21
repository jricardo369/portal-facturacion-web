# Cómo liberar espacio en el EC2

## Problema

El EC2 (`ip-172-31-5-49`) se queda sin espacio en disco y los deploys de GitHub Actions fallan con:

```
no space left on device
```

Esto impide:
- Construir imágenes Docker en GitHub Actions
- Descargar imágenes nuevas en el EC2 (`docker pull`)
- Arrancar contenedores nuevos

## Causa

- El disco del EC2 tiene solo **28GB** (instancia `t3.small` o similar con `t3.micro`).
- Las imágenes Docker se acumulan con cada deploy (versiones viejas de `portal-facturacion-api`, `portal-facturacion-web`, `caddy`).
- El JDK de Java (imagen del API) pesa ~300MB comprimido y ~1GB al extraerse.
- Con el tiempo, el disco llega al **97% de uso** y cualquier operación falla.

## Síntomas

1. GitHub Actions falla en el paso de deploy con `no space left on device`
2. `docker pull` falla al extraer capas
3. `docker compose up` no puede crear contenedores nuevos
4. El EC2 se vuelve lento o inestable

## Diagnóstico rápido

Conéctate por SSH al EC2 y ejecuta:

```bash
# Ver espacio en disco
df -h /

# Ver uso de inodos
df -i /

# Ver imágenes Docker acumuladas
docker images

# Ver contenedores corriendo
docker ps -a

# Ver qué proceso usa el puerto 80 (si hay conflicto)
sudo lsof -i :80

# Ver logs de un contenedor específico
docker logs <nombre-del-contenedor> --tail 50
```

## Solución paso a paso

### 1. Limpiar imágenes Docker no usadas

```bash
# Borrar TODAS las imágenes que no estén en uso por contenedores corriendo
docker image prune -af

# Borrar solo imágenes colgadas (dangling)
docker image prune -f

# Borrar TODO (imágenes, contenedores parados, redes sin uso, caché de builds)
docker system prune -a -f
```

### 2. Limpiar caché de Docker Buildx

Si usas `docker buildx` (builds con GitHub Actions en el EC2):

```bash
docker buildx prune -a -f
docker buildx rm --all-inactive -f 2>/dev/null || true
```

### 3. Limpiar logs del sistema

```bash
# Borrar logs del sistema de hace más de 3 días
sudo journalctl --vacuum-time=3d

# Borrar logs de Docker
sudo find /var/lib/docker/containers -name "*.log" -delete
```

### 4. Limpiar paquetes del sistema

```bash
sudo apt-get clean
sudo apt-get autoclean
sudo apt-get autoremove -y
```

### 5. Limpiar temporales

```bash
sudo rm -rf /tmp/* /var/tmp/*
```

### 6. Verificar que liberó

```bash
df -h /
```

## Lo que se hizo en los workflows de GitHub Actions

Para que este problema no se repita, se agregaron medidas preventivas en ambos workflows:

### En el build (job `build-test-push`)

Se agregó un paso al inicio que libera espacio en el **runner de GitHub** antes de construir:

```yaml
- name: Free disk space
  run: |
    sudo rm -rf /usr/share/dotnet
    sudo rm -rf /usr/local/lib/android
    sudo rm -rf /opt/ghc
    sudo rm -rf /opt/hostedtoolcache/CodeQL
    sudo docker image prune -af
    df -h
```

**Por qué:** Los runners de GitHub (`ubuntu-latest`) traen ~20GB de software preinstalado (Android SDK, .NET, etc.) que no se usa. Borrar eso libera ~20GB para el build.

### En el deploy (job `deploy`)

Se agregó limpieza de imágenes en el EC2 **antes** de bajar la nueva:

```yaml
COMPOSE="docker compose --env-file $ENV_FILE -f docker-compose.prod.yml"
docker image prune -af || true
df -h /
$COMPOSE pull web
$COMPOSE up -d --force-recreate --no-deps web
docker restart caddy || true
```

**Por qué:**
- `docker image prune -af` borra imágenes viejas del EC2 antes de descargar la nueva.
- `--no-deps web` evita que compose intente bajar también la imagen del API (que es grande por el JDK).
- `docker restart caddy` en vez de `stop + rm + up` evita el conflicto del puerto 80 (el proxy de Docker tarda en liberarlo).

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `portal-facturacion-api/.github/workflows/deploy.yml` | + Free disk space, + docker image prune |
| `portal-facturacion-web/.github/workflows/deploy.yml` | + Free disk space, + docker image prune, + --no-deps, + docker restart caddy |

## Si vuelve a pasar

1. **SSH al EC2**
2. Ejecuta `docker image prune -af` para liberar imágenes viejas
3. Ejecuta `df -h /` para confirmar que liberó
4. Re-ejecuta el workflow desde GitHub Actions

## Recomendación a largo plazo

El disco de 28GB es justo para correr Java + Docker + Caddy. Considera:

1. **Ampliar el volumen EBS** desde la consola AWS:
   - EC2 → Volumes → seleccionar el volumen → Modify
   - Aumentar a 50GB (se puede hacer sin apagar la instancia)

2. **Reducir el tamaño de la imagen del API:**
   - El Dockerfile usa `maven:3.9-eclipse-temurin-21` (~800MB) para build y `eclipse-temurin:21-jre-alpine` (~120MB) para runtime.
   - El build multi-stage ya es eficiente, pero cada imagen intermedia ocupa espacio.

3. **Configurar limpieza automática** en el EC2:
   ```bash
   # Cron diario a las 3 AM que limpia imágenes viejas
   echo "0 3 * * * /usr/bin/docker image prune -af --filter 'until=168h' 2>/dev/null" | sudo crontab -
   ```
   (Borra imágenes con más de 7 días que no estén en uso)
