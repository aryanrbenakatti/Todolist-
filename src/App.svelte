<script>
	let todos = [];
	let task = "";
	let filter = 'All';

	function addTask() {
		todos = [{
			task: task,
			status: "pending"
		}, ...todos];
		task = "";
	}

	function markComplete(i) {
		todos[i].status = "completed";
		todos = [...todos];
	}

	function removeTask(i) {
		todos.splice(i, 1);
		todos = [...todos];
	}
</script>

<style>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		overflow: hidden; /* Prevent scrolling */
	}

	body {
		font-family: 'Arial', sans-serif;
		width: 100vw;
		height: 100vh;
		overflow: hidden; /* Prevent scrolling */
	}

	.background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: url('./images/background.jpg');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		z-index: -1;
	}

	.container {
		width: 100%;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		background: rgba(0, 0, 0, 0.4); /* Dark semi-transparent overlay */
		backdrop-filter: blur(8px); /* Adds a blur effect */
	}

	.todo {
		padding: 30px;
		width: 400px;
		height: auto; /* Auto height to prevent overflow */
		background: rgba(255, 255, 255, 0.9); /* Transparent white background */
		border-radius: 15px;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.todo .form {
		display: flex;
		width: 100%;
		margin-bottom: 20px;
	}

	.todo .form input {
		flex: 1;
		padding: 12px;
		border: 1px solid #ccc;
		border-radius: 8px;
		outline: none;
		font-size: 16px;
		transition: border-color 0.3s;
	}

	.todo .form input:focus {
		border-color: #4caf50;
	}

	.todo .form button {
		padding: 12px 20px;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 16px;
		margin-left: 10px;
		transition: background-color 0.3s;
	}

	.todo .form button:hover {
		background-color: #388e3c;
	}

	.todo .tasks {
		width: 100%;
		height: auto;
		max-height: calc(100vh - 250px); /* Adjusted height to fit screen */
		overflow-y: auto; /* Internal scroll for tasks only */
		margin-bottom: 20px;
	}

	.todo .tasks > .task {
		display: flex;
		align-items: center;
		background-color: #f1f8e9; /* Light green for tasks */
		padding: 10px;
		margin-bottom: 10px;
		border-radius: 8px;
		transition: transform 0.3s;
	}

	.todo .tasks > .task:hover {
		transform: scale(1.05);
	}

	.todo .tasks > .task.completed {
		background-color: #c8e6c9; /* Completed tasks have a darker green */
	}

	.todo .tasks > .task > div {
		flex: 1;
		font-size: 16px;
		color: #333;
		text-decoration: none;
	}

	.todo .tasks > .task > button {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		border: none;
		margin-left: 5px;
		cursor: pointer;
		font-size: 16px;
		transition: background-color 0.3s, color 0.3s;
	}

	.todo .tasks > .task > button.tick {
		background-color: #81c784; /* Green for tick button */
		color: white;
	}

	.todo .tasks > .task > button.tick:hover {
		background-color: #66bb6a;
	}

	.todo .tasks > .task > button.cross {
		background-color: #e57373; /* Red for cross button */
		color: white;
	}

	.todo .tasks > .task > button.cross:hover {
		background-color: #ef5350;
	}

	.todo .filters {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.todo .filters > button {
		flex: 1;
		padding: 10px;
		margin: 0 5px;
		border: none;
		border-radius: 8px;
		background-color: #90caf9; /* Blue for filter buttons */
		color: white;
		cursor: pointer;
		font-size: 16px;
		transition: background-color 0.3s;
	}

	.todo .filters > button:hover {
		background-color: #42a5f5;
	}

	.todo .filters > button.active {
		background-color: #1e88e5; /* Darker blue for active filters */
	}
</style>

<div class="background"></div>
<div class="container">
	<div class="todo">
		<h2 style="margin-bottom: 20px; color: #4caf50;">Todo List</h2>
		<div class="form">
			<input type="text" bind:value={task} placeholder="Enter your task" />
			<button on:click={addTask}>Add</button>
		</div>

		<div class="tasks">
			{#each todos as todo, i}
				{#if filter === 'all'}
					<div class="task {todo.status}">
						<div>{todo.task}</div>
						<button class="tick" on:click={() => markComplete(i)}>
							&#10004;
						</button>
						<button class="cross" on:click={() => removeTask(i)}>
							&#10006;
						</button>
					</div>
				{:else if filter === 'completed'}
					{#if todo.status === 'completed'}
						<div class="task completed">
							<div>{todo.task}</div>
							<button class="cross" on:click={() => removeTask(i)}>
								&#10006;
							</button>
						</div>
					{/if}
				{:else}
					{#if todo.status === 'pending'}
						<div class="task">
							<div>{todo.task}</div>
							<button class="tick" on:click={() => markComplete(i)}>
								&#10004;
							</button>
						</div>
					{/if}
				{/if}
			{/each}
		</div>

		<div class="filters">
			<button class="{filter === 'all' ? 'active' : ''}" on:click={() => filter = 'all'}>
				All
			</button>
			<button class="{filter === 'completed' ? 'active' : ''}" on:click={() => filter = 'completed'}>
				Completed
			</button>
			<button class="{filter === 'incomplete' ? 'active' : ''}" on:click={() => filter = 'incomplete'}>
				Incomplete
			</button>
		</div>
	</div>
</div>
