
<!DOCTYPE html>
<html>
<head><title>Login</title></head>
<body>
    <form method="POST" action="/login">
        @csrf
        <input type="password" name="password" placeholder="Kata kunci">
        <button type="submit">Login</button>
        @error('password') <p>{{ $message }}</p> @enderror
    </form>
</body>
</html>
