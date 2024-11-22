<script>
	let todos = [];
	let task = "";
	let filter = 'All';
	let src = './images/background.jpg'


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
	}

	body {
		font-family: 'Arial', sans-serif;
		background-image: url('');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.container {
		width: 100%;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		background: rgba(255, 255, 255, 0.8); 
		backdrop-filter: blur(5px);
	}

	.todo {
		padding: 30px;
		background: #ffffff;
		width: 300px;
		border-radius: 12px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.todo .form {
		display: flex;
		margin-bottom: 20px;
	}

	.todo .form input {
		flex: 1;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 6px;
		outline: none;
		font-size: 16px;
	}

	.todo .form input:focus {
		border-color: #1e85eb;
	}

	.todo .form button {
		padding: 10px;
		background-color: #1e85eb;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 16px;
		margin-left: 10px;
		transition: background-color 0.3s;
	}

	.todo .form button:hover {
		background-color: #155a8a;
	}

	.todo .tasks {
		max-height: 300px;
		overflow-y: auto;
		margin-bottom: 20px;
	}

	.todo .tasks > .task {
		display: flex;
		align-items: center;
		background-color: #f9f9f9;
		padding: 12px;
		margin-bottom: 10px;
		border-radius: 8px;
		transition: transform 0.3s;
	}

	.todo .tasks > .task:hover {
		transform: scale(1.05);
	}

	.todo .tasks > .task.completed {
		background-color: #e0f7fa;
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
		border: 1px solid #1e85eb;
		border-radius: 50%;
		margin-left: 5px;
		cursor: pointer;
		background-color: transparent;
		transition: background-color 0.3s, color 0.3s;
	}

	.todo .tasks > .task > button.tick:hover {
		background-color: #13c416;
		color: white;
	}

	.todo .tasks > .task > button.tick.active {
		background-color: #13c416; 
		color: white;
	}

	.todo .tasks > .task > button.cross:hover {
		background-color: #ff4c4c; 
		color: white;
	}

	.todo .tasks > .task > button.cross {
		background-color: transparent; 
		color: #ff4c4c; 
		border: 1px solid #ff4c4c;
	}

	.todo .filters {
		display: flex;
		justify-content: space-between;
	}

	.todo .filters > button {
		padding: 10px;
		border: 1px solid #1e85eb;
		border-radius: 15px;
		background-color: white;
		color: #1e85eb;
		cursor: pointer;
		font-size: 16px;
		transition: background-color 0.3s, color 0.3s;
		margin-right: 10px;
	}

	.todo .filters > button:hover {
		background-color: #1e85eb;
		color: white;
	}

	.todo .filters > button.active {
		background-color: #1e85eb;
		color: white;
	}

	.todo .filters > button:last-child {
		margin-right: 0;
	}

	@media (max-width: 600px) {
		.todo {
			width: 90%;
			padding: 20px;
		}

		.todo .form input {
			font-size: 14px;
		}

		.todo .form button {
			font-size: 14px;
		}
	}
</style>

<div class="container">
	<div class="todo">
		<div class="form">
			
			<input type="text" bind:value={task} placeholder="Enter your task" />
			<button on:click={addTask}>Add</button>
		</div>

		<div class="tasks">
			{#each todos as todo, i}
				{#if filter === 'all'}
					<div class="task {todo.status}">
						<div>{todo.task}</div>
						<button class="tick {todo.status === 'completed' ? 'active' : ''}" on:click={() => markComplete(i)}>
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
							<button class="tick {todo.status === 'completed' ? 'active' : ''}" on:click={() => markComplete(i)}>
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
